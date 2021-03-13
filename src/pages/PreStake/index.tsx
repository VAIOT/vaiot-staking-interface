import { unwrappedToken } from '../../utils/wrappedCurrency'
import { useCurrency } from '../../hooks/Tokens'
import { currencyId } from '../../utils/currencyId'
import React, { useCallback, useMemo, useState } from 'react'
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
import { matchPath } from 'react-router'
import { useLocation } from 'react-router-dom'
import { useLockupInfo } from '../../state/lockup/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useLockup } from '../../hooks/useContract'
import { TransactionResponse } from '@ethersproject/providers'

export function parseBigNumber(value: TokenAmount): string {
  return value.greaterThan(BigInt(100000))
    ? value.divide(BigInt(1000000)).toFixed(2) + ' M'
    : value.toSignificant(2, { groupSeparator: ',' })
}

export default function PreStake() {
  const { chainId, account } = useActiveWeb3React()

  const location = useLocation()

  const privateSale = matchPath(location.pathname, '/prestake-lockup')?.isExact ?? true

  const token = chainId ? VAI[chainId] : undefined

  const currency0 = token ? unwrappedToken(token) : undefined

  const currencyA = useCurrency(currency0 ? currencyId(currency0) : undefined)

  const stakingInfo = usePreStakingInfo()?.[0]

  const lockupInfo = useLockupInfo()?.[0]

  const tokenBalance = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.token)

  const userVaiUnstaked = !privateSale ? tokenBalance : lockupInfo?.currentAmount

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)

  const disableTop = !stakingInfo?.stakedAmount || stakingInfo.stakedAmount.equalTo(JSBI.BigInt(0))

  const backgroundColor = useColor(token)

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
  const addTransaction = useTransactionAdder()
  const lockupContract = useLockup(lockupInfo?.lockupAddress)
  const beneficiary = useMemo(() => [account ?? undefined], [account])
  async function unlock() {
    console.log(beneficiary)
    if (lockupContract) {
      await lockupContract
        .unlock(beneficiary[0], { gasLimit: 300000 })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Unlock lockup`
          })
        })
        .catch((error: any) => {
          console.log(error)
        })
    }
  }

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
              {'% ARR + 0.2% daily'}
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
            privateSale={privateSale}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            preStakingInfo={stakingInfo}
            privateSale={privateSale}
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
          {stakingInfo && (
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              width="160px"
              onClick={handleDepositClick}
              disabled={stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))}
            >
              Deposit
            </ButtonPrimary>
          )}

          {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) && (
            <>
              <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowUnstakingModal(true)}>
                Withdraw
              </ButtonPrimary>
            </>
          )}
        </DataRow>
        <ButtonPrimary
          padding="8px"
          borderRadius="8px"
          width="160px"
          onClick={() => unlock()}
          disabled={stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))}
        >
          Unlock
        </ButtonPrimary>

        <TYPE.white style={{justifyContent: 'center', textAlign: 'center'}}>
          Attention! You can unlock your VAI <b><u>only once</u></b> every lockup period (30 days). If you try to unlock eariler, you
          won't get your VAI, but you will <b><u>still pay transaction fee!</u></b>
          <br />
          <br />
          Below are unlock times:
          <br />
          15 Apr 2021
          <br />
          15 May 2021
          <br />
          15 Jun 2021
          <br />
          15 Jul 2021
        </TYPE.white>

        <TYPE.white>
          Detailed Pre-Staking rules available{' '}
          <a href={'https://vaiotltd.medium.com/vai-token-pre-staking-re-launch-fea723e178a9'}>here</a>
        </TYPE.white>
      </PositionInfo>
    </PageWrapper>
  )
}
