import React, { useCallback } from 'react'
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
import { CardBGImage, CardNoise, CardSection } from '../../components/earn/styled'
import { ButtonPrimary } from '../../components/Button'
import VaiStackingModal from '../../components/VaiStake/VaiStakeModal'
import WithdrawTokensModal from 'components/VaiStake/WithdrawTokensModal'
import WithdrawRewardsModal from 'components/VaiStake/WithdrawRewardsModal'
import { SupportedChainId } from 'constants/chains'
import { OutlineCard } from 'components/Card'
import { switchToNetwork } from 'utils/switchToNetwork'

const SUPPORTED_CHAIN_IDS = [SupportedChainId.POLYGON, SupportedChainId.MUMBAI]

export function parseBigNumber(value: TokenAmount): string {
  return value.greaterThan(BigInt(100000))
    ? value.divide(BigInt(1000000)).toFixed(2) + ' M'
    : value.toSignificant(6, { groupSeparator: ',' })
}

export default function VaiStake() {
  const { chainId, account, library } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const isChainIdSupported = Boolean(SUPPORTED_CHAIN_IDS.includes(chainId as any))

  const token = chainId ? VAI[chainId] : undefined

  const stakingModalState = useDialogState()
  const withdrawTokensModalState = useDialogState()
  const withdrawRewardModalState = useDialogState()

  const stakingInfo = useVaiStakingInfo()

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

  const handleWithdrawTokensClick = useCallback(() => {
    withdrawTokensModalState.open()
  }, [withdrawTokensModalState])

  const handleWithdrawRewardClick = useCallback(() => {
    withdrawRewardModalState.open()
  }, [withdrawRewardModalState])

  const handleSwitchToPolygonNetwork = useCallback(() => {
    if (library) {
      switchToNetwork({ library, chainId: SupportedChainId.POLYGON })
    }
  }, [library])

  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>{token?.symbol} Staking</TYPE.mediumHeader>
        <CurrencyLogo currency={token} size="24px" />
      </RowBetween>

      {isChainIdSupported ? (
        <>
          <DataRow style={{ gap: '24px' }}>
            <PoolData>
              <AutoColumn gap="sm">
                <TYPE.body style={{ margin: 0 }}>Total deposits</TYPE.body>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <TYPE.body fontSize={24} fontWeight={500}>
                    {stakingInfo && stakingInfo.totalStakedAmount ? parseBigNumber(stakingInfo.totalStakedAmount) : '0'}{' '}
                    /{' '}
                    {stakingInfo && stakingInfo.currentStakingLimit
                      ? parseBigNumber(stakingInfo.currentStakingLimit)
                      : '0'}
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
              {stakingInfo && (
                <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
                  Deposit
                </ButtonPrimary>
              )}

              {hasStackedAmount && (
                <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleWithdrawTokensClick}>
                  Withdraw deposit
                </ButtonPrimary>
              )}

              {hadEarnedAmount && (
                <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleWithdrawRewardClick}>
                  Claim Rewards
                </ButtonPrimary>
              )}
            </DataRow>
          </PositionInfo>

          {stakingInfo && (
            <>
              <VaiStackingModal
                isOpen={stakingModalState.isOpen}
                onDismiss={stakingModalState.close}
                vaiStakingInfo={stakingInfo}
              />

              <WithdrawTokensModal
                isOpen={withdrawTokensModalState.isOpen}
                onDismiss={withdrawTokensModalState.close}
                stakingInfo={stakingInfo}
              />

              <WithdrawRewardsModal
                isOpen={withdrawRewardModalState.isOpen}
                onDismiss={withdrawRewardModalState.close}
                stakingInfo={stakingInfo}
              />
            </>
          )}
        </>
      ) : (
        <>
          <OutlineCard>This network is not supported, please switch to Polygon Mainnet</OutlineCard>
          <DataRow style={{ justifyContent: 'center' }}>
            {account && (
              <DataRow style={{ justifyContent: 'center' }}>
                <ButtonPrimary padding="8px" borderRadius="8px" width="200px" onClick={handleSwitchToPolygonNetwork}>
                  Switch to Polygon
                </ButtonPrimary>
              </DataRow>
            )}
          </DataRow>
        </>
      )}
    </PageWrapper>
  )
}
