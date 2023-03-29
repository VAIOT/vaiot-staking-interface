import { useMemo } from 'react'
import { Fraction, JSBI, Token, TokenAmount } from '@uniswap/sdk'

import { VAI_STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { VAI } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useMultipleContractSingleData } from '../multicall/hooks'
import { SupportedChainId } from 'constants/chains'

const SECONDS_IN_YEAR = 24 * 60 * 60 * 365

type TokenInfo = {
  token: Token
  stakingRewardAddress: string
}

export const VAI_STAKING_REWARD_INFO: Partial<Record<SupportedChainId, TokenInfo>> = {
  [SupportedChainId.POLYGON]: {
    token: VAI[SupportedChainId.POLYGON],
    stakingRewardAddress: '0x15b661FB563432BBbe3cE8A6CaCec148131f16BE'
  },
  [SupportedChainId.MUMBAI]: {
    token: VAI[SupportedChainId.MUMBAI],
    stakingRewardAddress: '0x15b661FB563432BBbe3cE8A6CaCec148131f16BE'
  }
} as const

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
  // pool finish time
  finishAtAmount: Date | undefined
}

export function useVaiStakingInfo() {
  const { chainId, account } = useActiveWeb3React()

  const info = useMemo(
    () =>
      (chainId
        ? VAI_STAKING_REWARD_INFO[chainId] ?? VAI_STAKING_REWARD_INFO[SupportedChainId.POLYGON]
        : VAI_STAKING_REWARD_INFO[SupportedChainId.POLYGON]) as TokenInfo,
    [chainId]
  )

  const vai = chainId ? VAI[chainId] : VAI[SupportedChainId.POLYGON]

  const rewardsAddresses = useMemo(() => [info.stakingRewardAddress], [info])

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
  const getFinishAtQuery = useMultipleContractSingleData(rewardsAddresses, VAI_STAKING_REWARDS_INTERFACE, 'getFinishAt')
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
    const getStakeLimitState = getStakeLimitQuery[responseIndex]
    const getRewardRateState = getRewardRateQuery[responseIndex]
    const getFinishAtState = getFinishAtQuery[responseIndex]
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
      getFinishAtState &&
      !getFinishAtState.loading &&
      !accountBalanceState?.loading &&
      !accountEarnedState?.loading

    if (isNotPending) {
      const hasError =
        getTotalSupplyState?.error ||
        getPoolLimitState?.error ||
        getRewardRateState?.error ||
        getStakeLimitState?.error ||
        accountBalanceState?.error ||
        getFinishAtState?.error ||
        accountEarnedState?.error

      if (hasError) {
        return null
      }

      const token = info.token

      const totalSupplyAmount = new TokenAmount(token, getTotalSupplyState.result?.[0] ?? 0)
      const poolLimitAmount = new TokenAmount(token, getPoolLimitState.result?.[0] ?? 0)
      const rewardRatesAmount = new TokenAmount(token, getRewardRateState.result?.[0] ?? 0)
      const maxStakeAmount = new TokenAmount(token, getStakeLimitState.result?.[0] ?? 0)
      const balanceAmount = new TokenAmount(token, accountBalanceState?.result?.[0] ?? 0)
      const earnedAmount = new TokenAmount(token, accountEarnedState?.result?.[0] ?? 0)
      const finishAtAmount = getFinishAtState?.result?.[0]?.toNumber()
      const finishAtAmountInMs = finishAtAmount * 1000

      const totalRewardRate = rewardRatesAmount
        .multiply(JSBI.BigInt(100 * SECONDS_IN_YEAR))
        .divide(totalSupplyAmount.greaterThan(JSBI.BigInt(0)) ? totalSupplyAmount : JSBI.BigInt(1))

      return {
        stakingRewardAddress: rewardsAddress,
        token: token,
        earnedAmount: earnedAmount,
        stakedAmount: balanceAmount,
        totalStakedAmount: totalSupplyAmount,
        currentStakingLimit: poolLimitAmount,
        totalRewardRate: totalRewardRate,
        maxStakeAmount: maxStakeAmount,
        finishAtAmount: finishAtAmountInMs > 0 ? new Date(finishAtAmountInMs) : undefined
      }
    }

    return null
  }, [
    chainId,
    vai,
    rewardsAddresses,
    getTotalSupplyQuery,
    getPoolLimitQuery,
    getStakeLimitQuery,
    getRewardRateQuery,
    getFinishAtQuery,
    accountBalanceQuery,
    accountEarnedQuery,
    info.token
  ])
}
