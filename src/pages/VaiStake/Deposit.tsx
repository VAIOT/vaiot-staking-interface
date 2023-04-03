import React, { useCallback, useEffect, useRef } from 'react'
import { CountUp } from 'use-count-up'
import { JSBI, TokenAmount } from '@uniswap/sdk'

import { useDialogState } from '../../hooks/useDialogState'
import { useVaiStakingInfo } from '../../state/vai-stake/hooks'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useActiveWeb3React } from '../../hooks'
import usePrevious from '../../hooks/usePrevious'
import { VAI } from '../../constants'

import {
  BottomSection,
  DataRow,
  IsFinalizeAccessible,
  IsWithdrawalAccessible,
  PageWrapper,
  PoolData,
  PositionInfo,
  StyledBottomCard,
  StyledDataCard
} from '../Earn/Manage'
import { RowBetween } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { TYPE } from '../../theme'
import { AutoColumn } from '../../components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { ButtonPrimary } from '../../components/Button'
import VaiStackingModal from '../../components/VaiStake/VaiStakeModal'
import WithdrawRewardsModal from 'components/VaiStake/WithdrawRewardsModal'
import { SupportedChainId } from 'constants/chains'
import { TopSection } from '../Earn'
import { Countdown } from 'pages/Earn/Countdown'
import { WITHDRAWAL_GENESIS } from 'state/stake/hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import WithdrawTokensStagesModal from 'components/VaiStake/WithdrawTokensStagesModal'
import WithdrawTokensImmediatelyModal from 'components/VaiStake/WithdrawTokensImmediatelyModal'

const SUPPORTED_CHAIN_IDS = [SupportedChainId.POLYGON, SupportedChainId.MUMBAI]

export function parseBigNumber(value: TokenAmount): string {
  return value.greaterThan(BigInt(100000))
    ? value.divide(BigInt(1000000)).toFixed(2) + ' M'
    : value.toSignificant(6, { groupSeparator: ',' })
}

export default function VaiStakeDeposit() {
  const timeLeft = useRef<Date | undefined>()
  const { chainId, account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const isChainIdSupported = Boolean(SUPPORTED_CHAIN_IDS.includes(chainId as any))

  const token = chainId ? VAI[chainId] : undefined

  const stakingModalState = useDialogState()
  const withdrawRewardModalState = useDialogState()

  const withdrawTokensImmediatelyModalState = useDialogState()
  const withdrawTokensStagesModalState = useDialogState()

  const stakingInfo = useVaiStakingInfo()
  const stakingReturnValue = stakingInfo?.timeLeftToWithdraw

  useEffect(() => {
    if (stakingReturnValue && !timeLeft.current) {
      timeLeft.current = stakingReturnValue
    } else if (!stakingReturnValue && timeLeft.current) {
      timeLeft.current = undefined
    }
  }, [stakingReturnValue])

  const userLiquidityUnstaked = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.token)
  const showAddLiquidityButton = Boolean(stakingInfo?.stakedAmount?.equalTo('0') && userLiquidityUnstaked?.equalTo('0'))

  const countUpAmount = stakingInfo?.earnedAmount?.toFixed(6) ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'

  const hasStackedAmount = stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))
  const hadEarnedAmount = stakingInfo?.earnedAmount?.greaterThan(JSBI.BigInt(0))

  const handleDepositClick = useCallback(() => {
    if (account) {
      stakingModalState.open()
    } else {
      toggleWalletModal()
    }
  }, [account, stakingModalState, toggleWalletModal])

  const handleWithdrawTokensImmediatelyClick = useCallback(() => {
    withdrawTokensImmediatelyModalState.open()
  }, [withdrawTokensImmediatelyModalState])

  const handleWithdrawTokensStagesClick = useCallback(() => {
    withdrawTokensStagesModalState.open()
  }, [withdrawTokensStagesModalState])

  const handleWithdrawRewardClick = useCallback(() => {
    withdrawRewardModalState.open()
  }, [withdrawRewardModalState])

  const end = WITHDRAWAL_GENESIS

  const isWithdrawalAccessible = IsWithdrawalAccessible(end)
  const isFinalizeAccesible = IsFinalizeAccessible(
    stakingInfo?.timeLeftToWithdraw ? stakingInfo.timeLeftToWithdraw.getTime() / 1000 : 0
  )

  return (
    <PageWrapper gap="lg" justify="center">
      {!isChainIdSupported || !account ? (
        <TopSection gap="md">
          <DataCard>
            <CardBGImage />
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>VAI Staking</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white fontSize={14}>
                    {!account
                      ? 'Please connect your wallet and deposit your tokens to stake VAI'
                      : 'This network is not supported, please switch to Polygon Mainnet'}
                  </TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <CardBGImage />
            <CardNoise />
          </DataCard>
        </TopSection>
      ) : null}

      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>{token?.symbol} Staking</TYPE.mediumHeader>
        <CurrencyLogo currency={token} size="24px" />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>Total deposits</TYPE.body>
            <RowBetween style={{ alignItems: 'baseline' }}>
              <TYPE.body fontSize={24} fontWeight={500}>
                {stakingInfo && stakingInfo.totalStakedAmount ? parseBigNumber(stakingInfo.totalStakedAmount) : '0'} /{' '}
                {stakingInfo && stakingInfo.currentStakingLimit ? parseBigNumber(stakingInfo.currentStakingLimit) : '0'}
              </TYPE.body>
              <TYPE.white>VAI</TYPE.white>
            </RowBetween>
          </AutoColumn>
        </PoolData>

        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>APR</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              {stakingInfo ? stakingInfo?.totalRewardRate.toSignificant(6) : '0'}
              {'%'}
            </TYPE.body>
          </AutoColumn>
        </PoolData>
      </DataRow>

      <PositionInfo gap="lg" justify="center" dim={null}>
        <BottomSection gap="lg" justify="center">
          <StyledDataCard disabled={!hasStackedAmount}>
            <CardSection>
              <CardBGImage desaturate />
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Your VAI deposits</TYPE.white>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <TYPE.white fontSize={36} fontWeight={600}>
                    {stakingInfo?.stakedAmount?.toSignificant(6) ?? '-'}
                  </TYPE.white>
                  <TYPE.white>VAI</TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
          </StyledDataCard>

          <StyledBottomCard dim={!hasStackedAmount}>
            <CardBGImage desaturate />
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <TYPE.black>Your earned VAI</TYPE.black>
                </div>
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <TYPE.largeHeader fontSize={36} fontWeight={600}>
                  <CountUp
                    key={countUpAmount}
                    isCounting
                    decimalPlaces={4}
                    start={parseFloat(countUpAmountPrevious)}
                    end={parseFloat(countUpAmount)}
                    thousandsSeparator={','}
                    duration={1}
                  />
                </TYPE.largeHeader>
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>

        <DataRow>
          {stakingInfo && isChainIdSupported && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
              Deposit
            </ButtonPrimary>
          )}

          {hasStackedAmount && (
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              width="160px"
              onClick={handleWithdrawTokensImmediatelyClick}
              disabled={!isWithdrawalAccessible || Boolean(stakingInfo?.withdrawalInitiated)}
            >
              Withdraw Immediately
            </ButtonPrimary>
          )}

          {hasStackedAmount && !stakingInfo?.withdrawalInitiated && (
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              width="160px"
              onClick={handleWithdrawTokensStagesClick}
              disabled={!isWithdrawalAccessible}
            >
              Initialize Withdraw
            </ButtonPrimary>
          )}

          {hasStackedAmount && stakingInfo?.withdrawalInitiated && (
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              width="160px"
              onClick={handleWithdrawTokensStagesClick}
              disabled={!isFinalizeAccesible}
            >
              Withdraw deposit
            </ButtonPrimary>
          )}

          {hadEarnedAmount && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleWithdrawRewardClick}>
              Claim Rewards
            </ButtonPrimary>
          )}
        </DataRow>

        {!showAddLiquidityButton && timeLeft.current && <Countdown exactEnd={timeLeft.current} finalize={true} />}
      </PositionInfo>

      {stakingInfo && (
        <>
          <VaiStackingModal
            isOpen={stakingModalState.isOpen}
            onDismiss={stakingModalState.close}
            vaiStakingInfo={stakingInfo}
          />

          <WithdrawTokensImmediatelyModal
            isOpen={withdrawTokensImmediatelyModalState.isOpen}
            onDismiss={withdrawTokensImmediatelyModalState.close}
            stakingInfo={stakingInfo}
          />

          <WithdrawTokensStagesModal
            isOpen={withdrawTokensStagesModalState.isOpen}
            onDismiss={withdrawTokensStagesModalState.close}
            stakingInfo={stakingInfo}
          />

          <WithdrawRewardsModal
            isOpen={withdrawRewardModalState.isOpen}
            onDismiss={withdrawRewardModalState.close}
            stakingInfo={stakingInfo}
          />
        </>
      )}
    </PageWrapper>
  )
}
