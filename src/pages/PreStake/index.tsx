import { unwrappedToken } from '../../utils/wrappedCurrency'
import { useCurrency } from '../../hooks/Tokens'
import { currencyId } from '../../utils/currencyId'
import React, { useEffect, useState } from 'react'
import { RowBetween } from '../../components/Row'
import { TYPE } from '../../theme'
import { AutoColumn } from '../../components/Column'
import { BottomSection, DataRow, PageWrapper, PositionInfo, StyledBottomCard, StyledDataCard } from '../Earn/Manage'
import { usePreStakingInfo } from '../../state/prestake/hooks'
import CurrencyLogo from '../../components/CurrencyLogo'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { useColor } from '../../hooks/useColor'
import { JSBI, TokenAmount } from '@uniswap/sdk'
import PreStakingModal from '../../components/PreStake/PreStakingModal'
// import { useWalletModalToggle } from '../../state/application/hooks'
import UnstakingModal from '../../components/PreStake/UnstakingModal'
import { CardBGImage, CardNoise, CardSection } from 'components/earn/styled'
import { ButtonPrimary } from '../../components/Button'
import { VAI } from '../../constants'
import { matchPath } from 'react-router'
import { useLocation } from 'react-router-dom'
import { useLockupInfo } from '../../state/lockup/hooks'
import { getEarned, getTotal } from '../../connectors/ApiConnector'

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

  const [earned, setEarned] = useState(0)
  const [total, setTotal] = useState(0)
  useEffect(() => {
    const fetchData = async () => {
      const currentEarned = await getEarned(account)
      const currentTotal = await getTotal(account)
      if (currentEarned.success && currentEarned.data?.earned) {
        setEarned(currentEarned.data.earned)
      }
      if (currentTotal.success && currentTotal.data?.total) {
        setTotal(currentTotal.data.total)
      }
    }
    fetchData()
  }, [account])
  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>
          {currencyA?.symbol} Pre-Staking - Pre-Sale Investors
        </TYPE.mediumHeader>
        <CurrencyLogo currency={currency0} size={'24'} />
      </RowBetween>
      <TYPE.white style={{ justifyContent: 'center', textAlign: 'justify' }}>
        <br />
        <br />
        <TYPE.white style={{ justifyContent: 'center', textAlign: 'center', display: 'block' }}>
          <b>
            <u>Token unlock schedule</u>
          </b>
          <br />
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
            <br />
            <div style={{ marginBottom: '10px' }}>15th June</div>
            <div>15th July</div>
          </div>
        </TYPE.white>
      </TYPE.white>

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
                    {total ?? '-'}
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
                  {earned ?? 0}
                </TYPE.largeHeader>
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>

        <DataRow style={{ marginBottom: '1rem' }}>
          {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) && stakingInfo?.isLockup && (
            <>
              <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowUnstakingModal(true)}>
                Upgrade to Auto-Staking
              </ButtonPrimary>
            </>
          )}
        </DataRow>
      </PositionInfo>
    </PageWrapper>
  )
}
