import { useEffect, useMemo, useState } from 'react'
import { Fraction, JSBI, Token, TokenAmount } from '@uniswap/sdk'

import { VAI_STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { VAI } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useMultipleContractSingleData } from '../multicall/hooks'
import { SupportedChainId } from 'constants/chains'
import { useConnectToVaiStakingContract } from '../../hooks/useConnectToContract'

const SECONDS_IN_YEAR = 24 * 60 * 60 * 365

function getTotalRewardRate(rewardRate: TokenAmount, totalSupply: TokenAmount) {
  return rewardRate
    .multiply(JSBI.BigInt(100 * SECONDS_IN_YEAR))
    .divide(totalSupply.greaterThan(JSBI.BigInt(0)) ? totalSupply : JSBI.BigInt(1))
}

type TokenInfo = {
  token: Token
  stakingRewardAddress: string
}

export const VAI_STAKING_REWARD_INFO: Partial<Record<SupportedChainId, TokenInfo>> = {
  [SupportedChainId.POLYGON]: {
    token: VAI[SupportedChainId.POLYGON],
    stakingRewardAddress: '0x0Ffb564630865ca870435038d6f5A3568DD32E9C'
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

  timeLeftToWithdraw: Date | undefined

  withdrawalInitiated: boolean
}

export function useVaiStakingInfo() {
  const { chainId: currentChainId, account } = useActiveWeb3React()
  const isProperChainId = (currentChainId as any) === SupportedChainId.POLYGON
  const chainId = SupportedChainId.POLYGON

  const [fallbackData, setFallbackData] = useState<{
    getTotalSupplyResult: PromiseSettledResult<any>
    getPoolLimitResult: PromiseSettledResult<any>
    getStakeLimitResult: PromiseSettledResult<any>
    getRewardRateResult: PromiseSettledResult<any>
    getFinishAtResult: PromiseSettledResult<any>
  } | null>(null)

  const info = useMemo(
    () =>
      (chainId
        ? VAI_STAKING_REWARD_INFO[chainId] ?? VAI_STAKING_REWARD_INFO[SupportedChainId.POLYGON]
        : VAI_STAKING_REWARD_INFO[SupportedChainId.POLYGON]) as TokenInfo,
    [chainId]
  )

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

  const getTimeLeftToWithdrawQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'getTimeLeftToWithdraw',
    accountsArgs
  )

  const withdrawalInitiatedQuery = useMultipleContractSingleData(
    rewardsAddresses,
    VAI_STAKING_REWARDS_INTERFACE,
    'withdrawalInitiated',
    accountsArgs
  )

  const stakingContract = useConnectToVaiStakingContract('0x15b661FB563432BBbe3cE8A6CaCec148131f16BE')

  useEffect(() => {
    async function getFallbackData() {
      if (stakingContract) {
        const [
          getTotalSupplyResult,
          getPoolLimitResult,
          getStakeLimitResult,
          getRewardRateResult,
          getFinishAtResult
        ] = await Promise.allSettled([
          stakingContract.getTotalSupply(),
          stakingContract.getPoolLimit(),
          stakingContract.getStakeLimit(),
          stakingContract.getRewardRate(),
          stakingContract.getFinishAt()
        ])

        setFallbackData({
          getTotalSupplyResult,
          getPoolLimitResult,
          getStakeLimitResult,
          getRewardRateResult,
          getFinishAtResult
        })
      }
    }

    if (currentChainId && !isProperChainId) {
      getFallbackData()
    }
  }, [isProperChainId, stakingContract, currentChainId])

  return useMemo(() => {
    if (!currentChainId) {
      return null
    }

    const responseIndex = 0
    const rewardsAddress = rewardsAddresses[responseIndex]
    const token = info.token
    // get data straight from the contract in case there is different chainId selected
    if (!isProperChainId) {
      if (
        fallbackData &&
        fallbackData.getTotalSupplyResult.status === 'fulfilled' &&
        fallbackData.getPoolLimitResult.status === 'fulfilled' &&
        fallbackData.getStakeLimitResult.status === 'fulfilled' &&
        fallbackData.getRewardRateResult.status === 'fulfilled' &&
        fallbackData.getFinishAtResult.status === 'fulfilled'
      ) {
        const {
          getTotalSupplyResult,
          getPoolLimitResult,
          getStakeLimitResult,
          getRewardRateResult,
          getFinishAtResult
        } = fallbackData

        const totalSupplyAmount = new TokenAmount(token, getTotalSupplyResult?.value ?? 0)
        const poolLimitAmount = new TokenAmount(token, getPoolLimitResult?.value ?? 0)
        const rewardRatesAmount = new TokenAmount(token, getRewardRateResult?.value ?? 0)
        const maxStakeAmount = new TokenAmount(token, getStakeLimitResult?.value ?? 0)
        const finishAtAmount = getFinishAtResult?.value?.toNumber()
        const finishAtAmountInMs = finishAtAmount * 1000

        const totalRewardRate = getTotalRewardRate(rewardRatesAmount, totalSupplyAmount)

        return {
          stakingRewardAddress: rewardsAddress,
          token: token,
          earnedAmount: new TokenAmount(token, '0'),
          stakedAmount: new TokenAmount(token, '0'),
          totalStakedAmount: totalSupplyAmount,
          currentStakingLimit: poolLimitAmount,
          totalRewardRate: totalRewardRate,
          maxStakeAmount: maxStakeAmount,
          finishAtAmount: finishAtAmountInMs > 0 ? new Date(finishAtAmountInMs) : undefined,
          timeLeftToWithdraw: undefined,
          withdrawalInitiated: false
        }
      }

      return null
    }

    // these get fetched regardless of account
    const getTotalSupplyState = getTotalSupplyQuery[responseIndex]
    const getPoolLimitState = getPoolLimitQuery[responseIndex]
    const getStakeLimitState = getStakeLimitQuery[responseIndex]
    const getRewardRateState = getRewardRateQuery[responseIndex]
    const getFinishAtState = getFinishAtQuery[responseIndex]
    const accountBalanceState = accountBalanceQuery[responseIndex]
    const accountEarnedState = accountEarnedQuery[responseIndex]
    const timeLeftToWithdrawState = getTimeLeftToWithdrawQuery[responseIndex]
    const withdrawalInitiatedState = withdrawalInitiatedQuery[responseIndex]

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
      !accountEarnedState?.loading &&
      timeLeftToWithdrawState &&
      !timeLeftToWithdrawState?.loading &&
      !withdrawalInitiatedState?.loading

    if (isNotPending) {
      const hasError =
        getTotalSupplyState?.error ||
        getPoolLimitState?.error ||
        getRewardRateState?.error ||
        getStakeLimitState?.error ||
        accountBalanceState?.error ||
        getFinishAtState?.error ||
        accountEarnedState?.error ||
        timeLeftToWithdrawState?.error ||
        withdrawalInitiatedState?.error

      if (hasError) {
        return null
      }

      const totalSupplyAmount = new TokenAmount(token, getTotalSupplyState.result?.[0] ?? 0)
      const poolLimitAmount = new TokenAmount(token, getPoolLimitState.result?.[0] ?? 0)
      const rewardRatesAmount = new TokenAmount(token, getRewardRateState.result?.[0] ?? 0)
      const maxStakeAmount = new TokenAmount(token, getStakeLimitState.result?.[0] ?? 0)
      const balanceAmount = new TokenAmount(token, accountBalanceState?.result?.[0] ?? 0)
      const earnedAmount = new TokenAmount(token, accountEarnedState?.result?.[0] ?? 0)
      const finishAtAmount = getFinishAtState?.result?.[0]?.toNumber()
      const finishAtAmountInMs = finishAtAmount * 1000
      const timeLeftToWithdraw = timeLeftToWithdrawState?.result?.[0]?.toNumber()
      const timeLeftToWithdrawInMs = timeLeftToWithdraw * 1000
      const totalRewardRate = getTotalRewardRate(rewardRatesAmount, totalSupplyAmount)

      return {
        stakingRewardAddress: rewardsAddress,
        token: token,
        earnedAmount: earnedAmount,
        stakedAmount: balanceAmount,
        totalStakedAmount: totalSupplyAmount,
        currentStakingLimit: poolLimitAmount,
        totalRewardRate: totalRewardRate,
        maxStakeAmount: maxStakeAmount,
        finishAtAmount: finishAtAmountInMs > 0 ? new Date(finishAtAmountInMs) : undefined,
        timeLeftToWithdraw:
          timeLeftToWithdrawInMs > 0 ? new Date(new Date().getTime() + timeLeftToWithdrawInMs) : undefined,
        withdrawalInitiated: withdrawalInitiatedState?.result?.[0]?.toNumber() !== 0
      }
    }

    return null
  }, [
    currentChainId,
    rewardsAddresses,
    info.token,
    isProperChainId,
    getTotalSupplyQuery,
    getPoolLimitQuery,
    getStakeLimitQuery,
    getRewardRateQuery,
    getFinishAtQuery,
    accountBalanceQuery,
    accountEarnedQuery,
    getTimeLeftToWithdrawQuery,
    withdrawalInitiatedQuery,
    fallbackData
  ])
}
