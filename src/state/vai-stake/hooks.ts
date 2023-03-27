import { useMemo } from 'react'
import { ChainId, Fraction, JSBI, Token, TokenAmount } from '@uniswap/sdk'

import { VAI_STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { VAI } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useMultipleContractSingleData } from '../multicall/hooks'
import { SupportedChainId } from 'constants/chains'

const SECONDS_IN_YEAR = 24 * 60 * 60 * 365

export const VAI_STAKING_REWARD_INFO: Partial<Record<
  SupportedChainId,
  {
    token: Token
    stakingRewardAddress: string
  }[]
>> = {
  [SupportedChainId.POLYGON]: [
    {
      token: VAI[SupportedChainId.POLYGON],
      stakingRewardAddress: '0x15b661FB563432BBbe3cE8A6CaCec148131f16BE'
    }
  ],
  [SupportedChainId.MUMBAI]: [
    {
      token: VAI[SupportedChainId.MUMBAI],
      stakingRewardAddress: '0x15b661FB563432BBbe3cE8A6CaCec148131f16BE'
    }
  ]
}

export interface VaiStakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the token involved in this pair
  token: Token
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount
  currentStakingLimit: TokenAmount
  // the percentage of token
  totalRewardRate: Fraction
  // max stake amount for account
  maxStakeAmount: TokenAmount
}

export function useVaiStakingInfo() {
  const { chainId, account } = useActiveWeb3React()

  const info = useMemo(() => (chainId ? VAI_STAKING_REWARD_INFO[chainId] ?? [] : []), [chainId])

  const vai = chainId ? VAI[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountsArgs = useMemo(() => [account ?? undefined], [account])

  const getTotalSupplyQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'getTotalSupply'
  )
  const getPoolLimitQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'getPoolLimit'
  )
  const getStakeLimitQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'getStakeLimit'
  )
  const getRewardRateQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'getRewardRate'
  )
  const accountBalanceQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'balanceOf',
    accountsArgs
  )
  const accountEarnedQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'earned',
    accountsArgs
  )

  return useMemo(() => {
    if (!chainId || !vai) return null

    const responseIndex = 0

    const rewardsAddress = rewardsAddresses[responseIndex]

    // these get fetched regardless of account
    const getTotalSupplyState = getTotalSupplyQuery[responseIndex]
    const getPoolLimitState = getPoolLimitQuery[responseIndex]
    const getRewardRateState = getRewardRateQuery[responseIndex]
    const getStakeLimitState = getStakeLimitQuery[responseIndex]
    const accountBalanceState = accountBalanceQuery[responseIndex]
    const accountEarnedState = accountEarnedQuery[responseIndex]

    const isNotPending =
      getTotalSupplyState &&
      !getTotalSupplyState.loading &&
      getPoolLimitState &&
      !getPoolLimitState.loading &&
      getStakeLimitState &&
      !getStakeLimitState.loading &&
      getRewardRateState &&
      !getRewardRateState.loading &&
      !accountBalanceState?.loading &&
      !accountEarnedState?.loading

    if (isNotPending) {
      const hasError =
        getTotalSupplyState?.error ||
        getPoolLimitState?.error ||
        getRewardRateState?.error ||
        getStakeLimitState?.error ||
        accountBalanceState?.error ||
        accountEarnedState?.error

      if (hasError) {
        return null
      }

      const token = info[responseIndex].token

      const totalSupplyAmount = new TokenAmount(token, getTotalSupplyState.result?.[0] ?? 0)
      const poolLimitAmount = new TokenAmount(token, getPoolLimitState.result?.[0] ?? 0)
      const rewardRatesAmount = new TokenAmount(token, getRewardRateState.result?.[0] ?? 0)
      const maxStakeAmount = new TokenAmount(token, getStakeLimitState.result?.[0] ?? 0)
      const balanceAmount = new TokenAmount(token, accountBalanceState?.result?.[0] ?? 0)
      const earnedAmount = new TokenAmount(token, accountEarnedState?.result?.[0] ?? 0)

      const totalRewardRate = rewardRatesAmount.multiply(JSBI.BigInt(100 * SECONDS_IN_YEAR)).divide(totalSupplyAmount)

      return {
        stakingRewardAddress: rewardsAddress,
        token: VAI[ChainId.MAINNET],
        earnedAmount: earnedAmount,
        stakedAmount: balanceAmount,
        totalStakedAmount: totalSupplyAmount,
        currentStakingLimit: poolLimitAmount,
        totalRewardRate: totalRewardRate,
        maxStakeAmount: maxStakeAmount
      }
    }

    return null
  }, [
    chainId,
    vai,
    rewardsAddresses,
    getTotalSupplyQuery,
    getPoolLimitQuery,
    getRewardRateQuery,
    getStakeLimitQuery,
    accountBalanceQuery,
    accountEarnedQuery,
    info
  ])
}
