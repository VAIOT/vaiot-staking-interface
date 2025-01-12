import { ChainId, JSBI, TokenAmount } from '@uniswap/sdk'
import React, { useEffect, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import tokenLogo from '../../assets/images/vai-token-circular.png'
import { VAI } from '../../constants'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useTotalUniEarned } from '../../state/stake/hooks'
import { useAggregateUniBalance, useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, StyledInternalLink, TYPE, UniTokenAnimated } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Break, CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { getCirculation } from '../../connectors/ApiConnector'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: linear-gradient(160deg, #000, #6360b5);
  padding: 0.5rem;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 16px;
  top: 16px;

  :hover {
    cursor: pointer;
  }
`

/**
 * Content for balance stats modal
 */
export default function UniBalanceContent({ setShowUniBalanceModal }: { setShowUniBalanceModal: any }) {
  const { account, chainId } = useActiveWeb3React()
  const vai = chainId ? VAI[chainId] : undefined

  const total = useAggregateUniBalance()
  const uniBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, vai)
  const uniToClaim: TokenAmount | undefined = useTotalUniEarned()

  const totalSupply: TokenAmount | undefined = useTotalSupply(vai)
  const [uniPrice, setUniPrice] = useState(0)

  const [circulation, setCirculation] = useState(new TokenAmount(vai ?? VAI[1], '0'))

  useEffect(() => {
    const fetchData = async () => {
      const result = await getCirculation()
      if (result.success) {
        setUniPrice(Number(result.data?.price ?? '0'))
        setCirculation(
          new TokenAmount(
            vai ?? VAI[1],
            JSBI.multiply(
              JSBI.BigInt((result.data?.circulation ?? 0).toFixed(0)),
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
            )
          )
        )
      }
    }
    fetchData()
  }, [vai])

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardBGImage />
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">Your VAI Breakdown</TYPE.white>
            <StyledClose stroke="white" onClick={() => setShowUniBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <Break />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <UniTokenAnimated width="48px" src={tokenLogo} />{' '}
                <TYPE.white fontSize={48} fontWeight={600} color="white">
                  {total?.toFixed(2, { groupSeparator: ',' })}
                </TYPE.white>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">Balance:</TYPE.white>
                  <TYPE.white color="white">{uniBalance?.toFixed(2, { groupSeparator: ',' })}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white color="white">Unclaimed:</TYPE.white>
                  <TYPE.white color="white">
                    {uniToClaim?.toFixed(4, { groupSeparator: ',' })}{' '}
                    {uniToClaim && uniToClaim.greaterThan('0') && (
                      <StyledInternalLink onClick={() => setShowUniBalanceModal(false)} to="/stake">
                        (claim)
                      </StyledInternalLink>
                    )}
                  </TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            {uniPrice > 0 && (
              <RowBetween>
                <TYPE.white color="white">VAI price:</TYPE.white>
                <TYPE.white color="white">${uniPrice?.toFixed(2) ?? '-'}</TYPE.white>
              </RowBetween>
            )}
            {circulation.greaterThan(JSBI.BigInt(0)) && (
              <RowBetween>
                <TYPE.white color="white">VAI in circulation:</TYPE.white>
                <TYPE.white color="white">{circulation?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>
              </RowBetween>
            )}

            <RowBetween>
              <TYPE.white color="white">Total Supply</TYPE.white>
              <TYPE.white color="white">{totalSupply?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>
            </RowBetween>
            {vai && vai.chainId === ChainId.MAINNET ? (
              <ExternalLink href={`https://uniswap.info/token/${vai.address}`}>View VAI Analytics</ExternalLink>
            ) : null}
          </AutoColumn>
        </CardSection>
      </ModalUpper>
    </ContentWrapper>
  )
}
