import JSBI from 'jsbi'
import React from 'react'
import styled from 'styled-components'

import { RowBetween } from '../../components/Row'
import { CardBGImage, CardNoise } from '../../components/earn/styled'
import { AutoColumn } from '../../components/Column'
import { VaiStakingInfo } from '../../state/vai-stake/hooks'
import CurrencyLogo from '../../components/CurrencyLogo'
import { TYPE, StyledInternalLink } from '../../theme'
import { ButtonPrimary } from '../../components/Button'
import { parseBigNumber } from './Deposit'

type PoolCardProps = {
  stakingInfo: VaiStakingInfo
}

export default function PoolCard({ stakingInfo }: PoolCardProps) {
  const isStaking = stakingInfo?.stakedAmount.greaterThan(JSBI.BigInt(0))

  const token = stakingInfo.token

  return (
    <Wrapper showBackground={isStaking}>
      <CardBGImage desaturate />
      <CardNoise />

      <TopSection>
        <CurrencyLogo currency={token} size="24px" />
        <TYPE.white fontWeight={600} fontSize={24} style={{ marginLeft: '8px' }}>
          {token.symbol}
        </TYPE.white>

        <StyledInternalLink to={`/vai-stake/deposit`} style={{ width: '100%' }}>
          <ButtonPrimary padding="8px" borderRadius="8px">
            {isStaking ? 'Manage' : 'Deposit'}
          </ButtonPrimary>
        </StyledInternalLink>
      </TopSection>

      <StatContainer>
        <RowBetween>
          <TYPE.white> Total deposited</TYPE.white>
          <TYPE.white>
            {stakingInfo && stakingInfo.totalStakedAmount ? parseBigNumber(stakingInfo.totalStakedAmount) : '0'} /{' '}
            {stakingInfo && stakingInfo.currentStakingLimit ? parseBigNumber(stakingInfo.currentStakingLimit) : '0'} VAI
          </TYPE.white>
        </RowBetween>
        <RowBetween>
          <TYPE.white> Pool rate </TYPE.white>
          <TYPE.white>
            {stakingInfo ? stakingInfo?.totalRewardRate.toSignificant(6) : '0'}
            {'%'}
          </TYPE.white>
        </RowBetween>
      </StatContainer>
    </Wrapper>
  )
}

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1rem;
  margin-right: 1rem;
  margin-left: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: none;
`};
`

const Wrapper = styled(AutoColumn)<{ showBackground: boolean }>`
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  position: relative;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '1')};
  background: linear-gradient(160deg, #000, #6360b5);
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;

  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  grid-gap: 0px;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 96px;
  `};
`
