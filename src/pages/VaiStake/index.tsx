import React from 'react'
import { TokenAmount } from '@uniswap/sdk'
import styled from 'styled-components'

import { useVaiStakingInfo } from '../../state/vai-stake/hooks'
import { useActiveWeb3React } from '../../hooks'

import { PageWrapper } from '../Earn/Manage'
import { RowBetween } from '../../components/Row'
import { TYPE } from '../../theme'
import { AutoColumn } from '../../components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { SupportedChainId } from '../../constants/chains'
import { OutlineCard } from '../../components/Card'
import { TopSection } from '../Earn'
import { Countdown } from '../Earn/Countdown'
import PoolCard from './PoolCard'

const SUPPORTED_CHAIN_IDS = [SupportedChainId.POLYGON, SupportedChainId.MUMBAI]

export function parseBigNumber(value: TokenAmount): string {
  return value.greaterThan(BigInt(100000))
    ? value.divide(BigInt(1000000)).toFixed(2) + ' M'
    : value.toSignificant(6, { groupSeparator: ',' })
}

export default function VaiStake() {
  const { chainId, account } = useActiveWeb3React()

  const isChainIdSupported = Boolean(SUPPORTED_CHAIN_IDS.includes(chainId as any))

  const stakingInfo = useVaiStakingInfo()

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

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>VAI Staking Pool</TYPE.mediumHeader>
          <Countdown exactEnd={stakingInfo?.finishAtAmount} />
        </DataRow>

        <PoolSection>
          {stakingInfo ? <PoolCard stakingInfo={stakingInfo} /> : <OutlineCard>No active pools</OutlineCard>}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
  flex-direction: column;
`};
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`
