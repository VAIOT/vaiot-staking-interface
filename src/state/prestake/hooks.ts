import { ChainId, JSBI, Pair, Token, TokenAmount } from '@bscswap/sdk'
import { VAI } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useMemo } from 'react'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { PRE_STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'

export const PRE_STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    token: Token
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.MAINNET]: [
    {
      token: VAI[ChainId.MAINNET],
      stakingRewardAddress: '0xafea6ab8ab06bf803026cc2099bff4f20e977ded'
    }
  ],
  [ChainId.ROPSTEN]: [
    {
      token: VAI[ChainId.ROPSTEN],
      stakingRewardAddress: '0x590d4780eD198e17F1592F17Bb214322da7694aE'
    }
  ]
}

export interface PreStakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  token: Token
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount
  currentStakingLimit: TokenAmount
  // the percentage of token
  totalRewardRate: JSBI

  withdrawalTime: Date | undefined

  status: any
}

export function usePreStakingInfo(pairToFilterBy?: Pair | null): PreStakingInfo[] {
  const { chainId, account } = useActiveWeb3React()
  const info = useMemo(
    () =>
      chainId
        ? PRE_STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
            pairToFilterBy === undefined
              ? true
              : pairToFilterBy === null
              ? false
              : pairToFilterBy.involvesToken(stakingRewardInfo.token)
          ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )
  const vai = chainId ? VAI[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])
  const balances = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'balanceOf',
    accountArg
  )
  const totalSupplies = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'currentTotalStake'
  )
  const stakingLimit = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'currentStakingLimit'
  )

  const status = useMultipleContractSingleData(rewardsAddresses, PRE_STAKING_REWARDS_INTERFACE, 'status', accountArg)

  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )

  const earnedAmounts = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'earned',
    accountArg
  )

  const withdrawalTime = useMultipleContractSingleData(
    rewardsAddresses,
    PRE_STAKING_REWARDS_INTERFACE,
    'withdrawalTime',
    accountArg
  )

  return useMemo(() => {
    if (!chainId || !vai) return []

    return rewardsAddresses.reduce<PreStakingInfo[]>((memo, rewardsAddress, index) => {
      const balanceState = balances[index]
      const statusState = status[index]
      const earnedAmountState = earnedAmounts[index]
      const withdrawalTimeState = withdrawalTime[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const stakingLimitState = stakingLimit[index]

      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        !statusState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        stakingLimitState &&
        !stakingLimitState.loading
      ) {
        if (
          balanceState?.error ||
          // earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          stakingLimitState.error ||
          statusState?.error
          // timeUntilWithdrawalState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }
        const token = info[index].token
        const totalStakedAmount = new TokenAmount(token, totalSupplyState.result?.[0] ?? 0)
        const totalRewardRate = JSBI.BigInt(rewardRateState.result?.[0] ?? 0)
        const stakingLimit = new TokenAmount(token, JSBI.BigInt(stakingLimitState.result?.[0] ?? 0))
        const earned = new TokenAmount(token, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0))

        const withdrawalTimeSeconds = withdrawalTimeState?.result?.[0]?.toNumber() ?? 0
        const withdrawalTimeMS = withdrawalTimeSeconds * 1000
        memo.push({
          stakingRewardAddress: rewardsAddress,
          token: info[index].token,
          earnedAmount: earned,
          totalRewardRate: totalRewardRate,
          stakedAmount: new TokenAmount(vai, JSBI.BigInt(balanceState?.result?.[0] ?? 0)),
          totalStakedAmount: totalStakedAmount,
          status: statusState?.result?.[0] ?? 0,
          withdrawalTime: withdrawalTimeMS > 0 ? new Date(withdrawalTimeMS) : undefined,
          currentStakingLimit: stakingLimit
        })
      }
      return memo
    }, [])
  }, [
    balances,
    chainId,
    earnedAmounts,
    info,
    rewardsAddresses,
    totalSupplies,
    vai,
    stakingLimit,
    rewardRates,
    withdrawalTime,
    status
  ])
}
