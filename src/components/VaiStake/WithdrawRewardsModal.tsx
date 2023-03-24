import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'

import { useActiveWeb3React } from '../../hooks'
import { VaiStakingInfo } from '../../state/vai-stake/hooks'
import { useVaiStakingContract } from '../../hooks/useContract'
import { useTransactionAdder } from '../../state/transactions/hooks'

import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import { ButtonError } from '../Button'
import { LoadingView, SubmittedView } from '../ModalViews'
import { CloseIcon, TYPE } from '../../theme'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'

interface WithdrawRewardsModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: VaiStakingInfo
}

export default function WithdrawRewardsModal({ isOpen, onDismiss, stakingInfo }: WithdrawRewardsModalProps) {
  const { account } = useActiveWeb3React()

  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [error, setError] = useState<string>()

  const stakingContract = useVaiStakingContract(stakingInfo.stakingRewardAddress)

  const onWithdraw = async () => {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)

      await stakingContract
        .withdrawReward({ gasLimit: 300000 })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Withdraw rewards`
          })
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  const handleDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    if (!account) {
      setError('Connect Wallet')
    }
    if (!stakingInfo?.stakedAmount) {
      setError(prevError => prevError ?? 'Enter an amount')
    }
  }, [account, stakingInfo?.stakedAmount])

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Claim Rewards</TYPE.mediumHeader>
            <CloseIcon onClick={handleDismiss} />
          </RowBetween>
          {stakingInfo?.earnedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={stakingInfo?.earnedAmount} />}
              </TYPE.body>
              <TYPE.body>Earned VAI</TYPE.body>
            </AutoColumn>
          )}
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            You can withdraw and claim your earned reward.
          </TYPE.subHeader>
          {stakingInfo && (
            <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.earnedAmount} onClick={onWithdraw}>
              {error ?? 'Claim Rewards'}
            </ButtonError>
          )}
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={handleDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Claiming {stakingInfo?.earnedAmount?.toSignificant(4)} VAI</TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={handleDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Claim rewards</TYPE.body>
            <TYPE.body fontSize={20}></TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`
