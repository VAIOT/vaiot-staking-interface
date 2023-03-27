import { Interface } from '@ethersproject/abi'
import STAKING_REWARDS_ABI from './vaiot/StakingRewards.json'
import PRE_STAKING_REWARDS_ABI from './vaiot/PreStakingContract.json'
import VAI_STAKING_REWARDS_ABI from './vaiot/VaiStakingContract.json'
import LOCKUP_ABI from './vaiot/VAILockup.json'

const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI.abi)

const PRE_STAKING_REWARDS_INTERFACE = new Interface(PRE_STAKING_REWARDS_ABI.abi)

const VAI_STAKING_REWARDS_INTERFACE = new Interface(VAI_STAKING_REWARDS_ABI.abi)

const LOCKUP_INTERFACE = new Interface(LOCKUP_ABI.abi)

export { STAKING_REWARDS_INTERFACE, PRE_STAKING_REWARDS_INTERFACE, VAI_STAKING_REWARDS_INTERFACE, LOCKUP_INTERFACE }
