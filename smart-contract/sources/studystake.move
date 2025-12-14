/*
/// Module: studystake
module studystake::studystake;
*/

// For Move coding conventions, see
// https://docs.iota.org/developer/iota-101/move-overview/conventions


/// Module: studystake
/// Smart contract for accountability-based task staking on IOTA
/// Users stake IOTA tokens to commit to completing tasks.
/// If they complete the task, they get their stake back.
/// If they fail (forfeit), the stake is sent to a charity of their choice.
module studystake::studystake {
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::event;
    use std::string::String;
    use iota::balance::{Self, Balance};
    use iota::clock::{Self, Clock};

    // =================== Errors ===================
    
    const ETaskAlreadyExists: u64 = 0;
    const ETaskNotFound: u64 = 1;
    const ENotTaskOwner: u64 = 2;
    const ETaskNotActive: u64 = 3;
    const EInvalidStakeAmount: u64 = 4;
    const EInvalidCharityAddress: u64 = 5;
    const ETaskNotCompleted: u64 = 6;
    const ETaskDeadlinePassed: u64 = 7;
    const EInvalidDuration: u64 = 8;

    // =================== Structs ===================

    /// Represents a staked task
    public struct Task has key, store {
        id: UID,
        task_id: String,
        staker: address,
        stake: Balance<IOTA>,
        charity_address: address,
        is_active: bool,
        created_at: u64,
        duration_minutes: u64,
        start_time_ms: u64,
        deadline_ms: u64,
    }

    /// Shared object to manage all tasks
    public struct TaskRegistry has key {
        id: UID,
    }

    // =================== Events ===================

    public struct TaskStaked has copy, drop {
        task_id: String,
        staker: address,
        amount: u64,
        charity: address,
        timestamp: u64,
    }

    public struct TaskCompleted has copy, drop {
        task_id: String,
        staker: address,
        amount: u64,
        timestamp: u64,
    }

    public struct TaskForfeited has copy, drop {
        task_id: String,
        staker: address,
        amount: u64,
        charity: address,
        timestamp: u64,
    }

    // =================== Initialization ===================

    /// Initialize the module - called once on publish
    fun init(ctx: &mut TxContext) {
        let registry = TaskRegistry {
            id: object::new(ctx),
        };
        transfer::share_object(registry);
    }

    // =================== Public Functions ===================

    /// Stake IOTA tokens for a task commitment
    public entry fun stake_task(
        task_id: String,
        duration_minutes: u64,
        charity_address: address,
        stake_amount: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let staker = tx_context::sender(ctx);
        let amount = coin::value(&stake_amount);
        let timestamp = tx_context::epoch(ctx);
        let start_time_ms = clock::timestamp_ms(clock);
        let duration_ms = duration_minutes * 60 * 1000;
        let deadline_ms = start_time_ms + duration_ms;

        // Validate inputs
        assert!(amount > 0, EInvalidStakeAmount);
        assert!(charity_address != @0x0, EInvalidCharityAddress);
        assert!(duration_minutes > 0, EInvalidDuration);

        // Create task object
        let task = Task {
            id: object::new(ctx),
            task_id,
            staker,
            stake: coin::into_balance(stake_amount),
            charity_address,
            is_active: true,
            created_at: timestamp,
            duration_minutes,
            start_time_ms,
            deadline_ms,
        };

        // Emit event
        event::emit(TaskStaked {
            task_id,
            staker,
            amount,
            charity: charity_address,
            timestamp,
        });

        // Transfer task object to staker (they own it)
        transfer::transfer(task, staker);
    }

    /// Complete a task and retrieve staked funds
    public entry fun complete_task(
        task: Task,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let Task {
            id,
            task_id,
            staker,
            stake,
            charity_address: _,
            is_active,
            created_at: _,
            duration_minutes,
            start_time_ms,
            deadline_ms,
        } = task;

        // Validate
        assert!(is_active, ETaskNotActive);
        assert!(tx_context::sender(ctx) == staker, ENotTaskOwner);
        
        // Validate that enough time has passed (must complete full duration)
        let current_time_ms = clock::timestamp_ms(clock);
        let elapsed_ms = current_time_ms - start_time_ms;
        let required_ms = duration_minutes * 60 * 1000;
        assert!(elapsed_ms >= required_ms, ETaskNotCompleted);

        let amount = balance::value(&stake);
        let timestamp = tx_context::epoch(ctx);

        // Return stake to staker
        let stake_coin = coin::from_balance(stake, ctx);
        transfer::public_transfer(stake_coin, staker);

        // Emit event
        event::emit(TaskCompleted {
            task_id,
            staker,
            amount,
            timestamp,
        });

        // Delete task object
        object::delete(id);
    }

    /// Forfeit a task and send stake to charity
    public entry fun forfeit_task(
        task: Task,
        ctx: &mut TxContext
    ) {
        let Task {
            id,
            task_id,
            staker,
            stake,
            charity_address,
            is_active,
            created_at: _,
            duration_minutes: _,
            start_time_ms: _,
            deadline_ms: _,
        } = task;

        // Validate
        assert!(is_active, ETaskNotActive);
        assert!(tx_context::sender(ctx) == staker, ENotTaskOwner);

        let amount = balance::value(&stake);
        let timestamp = tx_context::epoch(ctx);

        // Send stake to charity
        let stake_coin = coin::from_balance(stake, ctx);
        transfer::public_transfer(stake_coin, charity_address);

        // Emit event
        event::emit(TaskForfeited {
            task_id,
            staker,
            amount,
            charity: charity_address,
            timestamp,
        });

        // Delete task object
        object::delete(id);
    }

    /// Auto-forfeit a task that has passed its deadline
    /// Anyone can call this to forfeit expired tasks
    public entry fun forfeit_expired_task(
        task: Task,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time_ms = clock::timestamp_ms(clock);
        
        // Check if deadline has passed
        assert!(current_time_ms > task.deadline_ms, ETaskDeadlinePassed);
        assert!(task.is_active, ETaskNotActive);

        let Task {
            id,
            task_id,
            staker,
            stake,
            charity_address,
            is_active: _,
            created_at: _,
            duration_minutes: _,
            start_time_ms: _,
            deadline_ms: _,
        } = task;

        let amount = balance::value(&stake);
        let timestamp = tx_context::epoch(ctx);

        // Send stake to charity
        let stake_coin = coin::from_balance(stake, ctx);
        transfer::public_transfer(stake_coin, charity_address);

        // Emit event
        event::emit(TaskForfeited {
            task_id,
            staker,
            amount,
            charity: charity_address,
            timestamp,
        });

        // Delete task object
        object::delete(id);
    }

    // =================== View Functions ===================

    /// Get task details
    public fun get_task_stake(task: &Task): u64 {
        balance::value(&task.stake)
    }

    public fun get_task_staker(task: &Task): address {
        task.staker
    }

    public fun get_task_charity(task: &Task): address {
        task.charity_address
    }

    public fun is_task_active(task: &Task): bool {
        task.is_active
    }

    public fun get_task_created_at(task: &Task): u64 {
        task.created_at
    }

    public fun get_duration_minutes(task: &Task): u64 {
        task.duration_minutes
    }

    public fun get_start_time_ms(task: &Task): u64 {
        task.start_time_ms
    }

    public fun get_deadline_ms(task: &Task): u64 {
        task.deadline_ms
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}


