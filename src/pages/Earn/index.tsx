import React, { useCallback } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { STAKING_REWARDS_INFO, useStakingInfo } from '../../state/stake/hooks'
import { ExternalLink, TYPE } from '../../theme'
import PoolCard from '../../components/earn/PoolCard'
import { RowBetween } from '../../components/Row'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { Countdown } from './Countdown'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
import { ButtonPrimary } from '../../components/Button'
import { OutlineCard } from '../../components/Card'
import { SupportedChainId } from 'constants/chains'
import { switchToNetwork } from 'utils/switchToNetwork'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

const SUPPORTED_CHAIN_IDS = [SupportedChainId.MAINNET]

export default function Earn() {
  const { chainId, library } = useActiveWeb3React()

  const isChainIdSupported = Boolean(SUPPORTED_CHAIN_IDS.includes(chainId as any))

  // staking info for connected account
  const stakingInfos = useStakingInfo()

  // toggle copy if rewards are inactive
  const stakingRewardsExist = Boolean(typeof chainId === 'number' && (STAKING_REWARDS_INFO[chainId]?.length ?? 0) > 0)

  const handleSwitchToEthNetwork = useCallback(() => {
    if (library) {
      switchToNetwork({ library, chainId: SupportedChainId.MAINNET })
    }
  }, [library])

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <DataCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Uniswap liquidity staking</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Deposit your Liquidity Provider tokens to receive VAI, the first VFAA-regulated token.
                </TYPE.white>
              </RowBetween>{' '}
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                href="https://vaiot.ai"
                target="_blank"
              >
                <TYPE.white fontSize={14}>Read more about VAIOT</TYPE.white>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </DataCard>
      </TopSection>

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        {isChainIdSupported ? (
          <>
            <DataRow style={{ alignItems: 'baseline' }}>
              <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Participating pools</TYPE.mediumHeader>
              <Countdown exactEnd={stakingInfos?.[0]?.periodFinish} />
            </DataRow>

            <PoolSection>
              {stakingRewardsExist && stakingInfos?.length === 0 ? (
                <Loader style={{ margin: 'auto' }} />
              ) : !stakingRewardsExist ? (
                <OutlineCard>No active pools</OutlineCard>
              ) : (
                stakingInfos?.map(stakingInfo => {
                  // need to sort by added liquidity here
                  return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} />
                })
              )}
            </PoolSection>
          </>
        ) : (
          <>
            <OutlineCard>This network is not supported, please switch to Ethereum Mainnet</OutlineCard>
            <DataRow style={{ justifyContent: 'center' }}>
              <ButtonPrimary padding="8px" borderRadius="8px" width="200px" onClick={handleSwitchToEthNetwork}>
                Switch to Ethereum
              </ButtonPrimary>
            </DataRow>
          </>
        )}
      </AutoColumn>
    </PageWrapper>
  )
}
