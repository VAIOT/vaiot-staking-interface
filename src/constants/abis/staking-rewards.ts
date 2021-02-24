import { Interface } from '@ethersproject/abi'
import { abi as STAKING_REWARDS_ABI } from '../../hooks/StakingRewards.json'
import { abi as PRE_STAKING_REWARDS_ABI } from '../../hooks/PreStakingContract.json'

const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI)

const PRE_STAKING_REWARDS_INTERFACE = new Interface(PRE_STAKING_REWARDS_ABI)

export { STAKING_REWARDS_INTERFACE, PRE_STAKING_REWARDS_INTERFACE }
