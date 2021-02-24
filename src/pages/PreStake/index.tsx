import { unwrappedToken } from '../../utils/wrappedCurrency'
import { useCurrency } from '../../hooks/Tokens'
import { currencyId } from '../../utils/currencyId'
import React, { useCallback, useEffect, useState } from 'react'
import { RowBetween } from '../../components/Row'
import { TYPE } from '../../theme'
import { AutoColumn } from '../../components/Column'
import {
  BottomSection,
  DataRow,
  PageWrapper,
  PoolData,
  PositionInfo,
  StyledBottomCard,
  StyledDataCard
} from '../Earn/Manage'
import { usePreStakingInfo } from '../../state/prestake/hooks'
import CurrencyLogo from '../../components/CurrencyLogo'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { useColor } from '../../hooks/useColor'
import { JSBI, TokenAmount } from '@uniswap/sdk'
import usePrevious from '../../hooks/usePrevious'
import PreStakingModal from '../../components/PreStake/PreStakingModal'
import { useWalletModalToggle } from '../../state/application/hooks'
import UnstakingModal from '../../components/PreStake/UnstakingModal'
import { CardBGImage, CardNoise, CardSection } from 'components/earn/styled'
import { ButtonPrimary } from '../../components/Button'
import { CountUp } from 'use-count-up'
import { VAI } from '../../constants'
import { PRE_STAKING_WITHDRAWAL_GENESIS } from '../../state/stake/hooks'
import { Countdown } from '../Earn/Countdown'

export function parseBigNumber(value: TokenAmount): string {
  return value.greaterThan(BigInt(100000))
    ? value.divide(BigInt(1000000)).toFixed(2) + ' M'
    : value.toSignificant(2, { groupSeparator: ',' })
}

export function IsWithdrawalAccessible(init: number, finalize: number | undefined) {
  const [time, setTime] = useState(() => Math.floor(Date.now() / 1000))
  const [isInitiateWithdrawalAccessible, setInitiateWithdrawalAccessible] = useState(() => false)
  const [isFinalizeWithdrawalAccessible, setFinalizeWithdrawalAccessible] = useState(() => false)
  useEffect((): (() => void) | void => {
    // we only need to tick if withdrawal is currently inaccessible
    if (time <= init) {
      const timeout = setTimeout(() => setTime(Math.floor(Date.now() / 1000)), 1000)
      return () => {
        clearTimeout(timeout)
      }
    } else {
      setInitiateWithdrawalAccessible(true)
    }
    if (finalize) {
      if (time <= finalize) {
        const timeout = setTimeout(() => setTime(Math.floor(Date.now() / 1000)), 1000)
        return () => {
          clearTimeout(timeout)
        }
      } else {
        setFinalizeWithdrawalAccessible(true)
      }
    } else {
      setFinalizeWithdrawalAccessible(false)
    }
  }, [time, finalize, isInitiateWithdrawalAccessible, isFinalizeWithdrawalAccessible, init])
  return { isInitiateWithdrawalAccessible, isFinalizeWithdrawalAccessible }
}

export default function PreStake() {
  const { chainId, account } = useActiveWeb3React()

  const token = chainId ? VAI[chainId] : undefined

  const currency0 = token ? unwrappedToken(token) : undefined

  const currencyA = useCurrency(currency0 ? currencyId(currency0) : undefined)

  const stakingInfo = usePreStakingInfo()?.[0]

  const userVaiUnstaked = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.token)

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)

  const disableTop = !stakingInfo?.stakedAmount || stakingInfo.stakedAmount.equalTo(JSBI.BigInt(0))

  const backgroundColor = useColor(token)

  const endDate = new Date(PRE_STAKING_WITHDRAWAL_GENESIS * 1000)
  const { isInitiateWithdrawalAccessible, isFinalizeWithdrawalAccessible } = IsWithdrawalAccessible(
    PRE_STAKING_WITHDRAWAL_GENESIS,
    stakingInfo && stakingInfo?.withdrawalTime?.getTime() ? stakingInfo?.withdrawalTime?.getTime() / 1000 : undefined
  )
  const countUpAmount = stakingInfo?.earnedAmount?.toFixed(6) ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'

  const toggleWalletModal = useWalletModalToggle()

  const handleDepositClick = useCallback(() => {
    if (account) {
      setShowStakingModal(true)
    } else {
      toggleWalletModal()
    }
  }, [account, toggleWalletModal])
  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>{currencyA?.symbol} Pre-Staking</TYPE.mediumHeader>
        <CurrencyLogo currency={currency0} size={'24'} />
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
            <TYPE.body style={{ margin: 0 }}>Pool Rate</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              {stakingInfo ? stakingInfo?.totalRewardRate.toString() : '0'}
              {'% ARR'}
            </TYPE.body>
          </AutoColumn>
        </PoolData>
      </DataRow>

      {stakingInfo && (
        <>
          <PreStakingModal
            isOpen={showStakingModal}
            onDismiss={() => setShowStakingModal(false)}
            preStakingInfo={stakingInfo}
            userVaiUnstaked={userVaiUnstaked}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            preStakingInfo={stakingInfo}
          />
        </>
      )}

      <PositionInfo gap="lg" justify="center" dim={null}>
        <BottomSection gap="lg" justify="center">
          <StyledDataCard disabled={disableTop} bgColor={backgroundColor} showBackground={true}>
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
          <StyledBottomCard dim={stakingInfo?.stakedAmount?.equalTo(JSBI.BigInt(0))}>
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

        <DataRow style={{ marginBottom: '1rem' }}>
          {stakingInfo && stakingInfo.status === 0 && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
              {'Deposit'}
            </ButtonPrimary>
          )}

          {stakingInfo?.status === 1 && (
            <>
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                width="160px"
                onClick={() => setShowUnstakingModal(true)}
                disabled={!isInitiateWithdrawalAccessible}
              >
                Initiate Withdrawal
              </ButtonPrimary>
            </>
          )}
          {stakingInfo?.status === 2 && (
            <>
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                width="160px"
                onClick={() => setShowUnstakingModal(true)}
                disabled={!isFinalizeWithdrawalAccessible}
              >
                Finalize Withdrawal
              </ButtonPrimary>
            </>
          )}
        </DataRow>
        {stakingInfo?.status === 1 && !isInitiateWithdrawalAccessible && (
          <Countdown exactEnd={endDate} withdraw={true} />
        )}
        {stakingInfo?.status === 2 && !isFinalizeWithdrawalAccessible && (
          <Countdown exactEnd={stakingInfo.withdrawalTime} withdraw={true} />
        )}

        <TYPE.white>
          Detailed Pre-Staking rules available <a href={'https://vaiot.ai'}>here</a>
        </TYPE.white>
      </PositionInfo>
    </PageWrapper>
  )
}
