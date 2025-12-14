/*
#[test_only]
module studystake::studystake_tests;
// uncomment this line to import the module
// use studystake::studystake;

const ENotImplemented: u64 = 0;

#[test]
fun test_studystake() {
    // pass
}

#[test, expected_failure(abort_code = ::studystake::studystake_tests::ENotImplemented)]
fun test_studystake_fail() {
    abort ENotImplemented
}
*/

#[test_only]
module studystake::studystake_tests {
    use studystake::studystake::{Self, Task};
    use iota::test_scenario::{Self as ts, Scenario};
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    use std::string;
    use iota::test_utils;

    const STAKER: address = @0xA;
    const CHARITY: address = @0xB;
    const STAKE_AMOUNT: u64 = 1000000000; // 1 IOTA

    #[test]
    fun test_stake_task() {
        let mut scenario = ts::begin(STAKER);
        
        // Initialize contract
        {
            ts::next_tx(&mut scenario, STAKER);
            studystake::init_for_testing(ts::ctx(&mut scenario));
        };

        // Stake a task
        {
            ts::next_tx(&mut scenario, STAKER);
            let stake_coin = coin::mint_for_testing<IOTA>(STAKE_AMOUNT, ts::ctx(&mut scenario));
            let task_id = string::utf8(b"task_001");
            
            studystake::stake_task(
                task_id,
                CHARITY,
                stake_coin,
                ts::ctx(&mut scenario)
            );
        };

        // Verify task was created
        {
            ts::next_tx(&mut scenario, STAKER);
            let task = ts::take_from_sender<Task>(&scenario);
            
            assert!(studystake::is_task_active(&task), 0);
            assert!(studystake::get_task_staker(&task) == STAKER, 1);
            assert!(studystake::get_task_charity(&task) == CHARITY, 2);
            assert!(studystake::get_task_stake(&task) == STAKE_AMOUNT, 3);
            
            ts::return_to_sender(&scenario, task);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_complete_task() {
        let mut scenario = ts::begin(STAKER);
        
        // Initialize and stake
        {
            ts::next_tx(&mut scenario, STAKER);
            studystake::init_for_testing(ts::ctx(&mut scenario));
        };

        {
            ts::next_tx(&mut scenario, STAKER);
            let stake_coin = coin::mint_for_testing<IOTA>(STAKE_AMOUNT, ts::ctx(&mut scenario));
            let task_id = string::utf8(b"task_002");
            
            studystake::stake_task(
                task_id,
                CHARITY,
                stake_coin,
                ts::ctx(&mut scenario)
            );
        };

        // Complete task
        {
            ts::next_tx(&mut scenario, STAKER);
            let task = ts::take_from_sender<Task>(&scenario);
            
            studystake::complete_task(task, ts::ctx(&mut scenario));
        };

        // Verify staker received funds back
        {
            ts::next_tx(&mut scenario, STAKER);
            let returned_coin = ts::take_from_sender<Coin<IOTA>>(&scenario);
            assert!(coin::value(&returned_coin) == STAKE_AMOUNT, 4);
            ts::return_to_sender(&scenario, returned_coin);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_forfeit_task() {
        let mut scenario = ts::begin(STAKER);
        
        // Initialize and stake
        {
            ts::next_tx(&mut scenario, STAKER);
            studystake::init_for_testing(ts::ctx(&mut scenario));
        };

        {
            ts::next_tx(&mut scenario, STAKER);
            let stake_coin = coin::mint_for_testing<IOTA>(STAKE_AMOUNT, ts::ctx(&mut scenario));
            let task_id = string::utf8(b"task_003");
            
            studystake::stake_task(
                task_id,
                CHARITY,
                stake_coin,
                ts::ctx(&mut scenario)
            );
        };

        // Forfeit task
        {
            ts::next_tx(&mut scenario, STAKER);
            let task = ts::take_from_sender<Task>(&scenario);
            
            studystake::forfeit_task(task, ts::ctx(&mut scenario));
        };

        // Verify charity received funds
        {
            ts::next_tx(&mut scenario, CHARITY);
            let donated_coin = ts::take_from_sender<Coin<IOTA>>(&scenario);
            assert!(coin::value(&donated_coin) == STAKE_AMOUNT, 5);
            ts::return_to_sender(&scenario, donated_coin);
        };

        ts::end(scenario);
    }
}

