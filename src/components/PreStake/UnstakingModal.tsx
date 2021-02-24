import React, { useState } from 'react'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { usePreStakingContract } from '../../hooks/useContract'
import { LoadingView, SubmittedView } from '../ModalViews'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
import { useActiveWeb3React } from '../../hooks'
import { PreStakingInfo } from '../../state/prestake/hooks'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  preStakingInfo: PreStakingInfo
}

export default function UnstakingModal({ isOpen, onDismiss, preStakingInfo }: StakingModalProps) {
  const { account } = useActiveWeb3React()

  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = usePreStakingContract(preStakingInfo.stakingRewardAddress)

  async function onInitializeWithdraw() {
    if (stakingContract && preStakingInfo?.stakedAmount) {
      setAttempting(true)
      await stakingContract
        .initiateWithdrawal({ gasLimit: 300000 })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Initiate Withdrawal`
          })
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  async function onWithdraw() {
    if (stakingContract && preStakingInfo?.stakedAmount) {
      setAttempting(true)
      await stakingContract
        .executeWithdrawal({ gasLimit: 300000 })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Execute Withdrawal`
          })
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!preStakingInfo?.stakedAmount) {
    error = error ?? 'Enter an amount'
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Withdraw</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOndismiss} />
          </RowBetween>
          {preStakingInfo?.stakedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={preStakingInfo.stakedAmount} />}
              </TYPE.body>
              <TYPE.body>Deposited VAI:</TYPE.body>
            </AutoColumn>
          )}
          {preStakingInfo?.earnedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={preStakingInfo?.earnedAmount} />}
              </TYPE.body>
              <TYPE.body>Earned VAI</TYPE.body>
            </AutoColumn>
          )}
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            {preStakingInfo?.status === 2
              ? 'You can execute withdrawal and claim both your stake deposit and earned reward.'
              : "When you initiate withdrawal, rewards stop being charged and you'll be able to reclaim both your stake deposit and earned reward."}
          </TYPE.subHeader>
          {preStakingInfo?.status === 1 && (
            <ButtonError
              disabled={!!error}
              error={!!error && !!preStakingInfo?.stakedAmount}
              onClick={onInitializeWithdraw}
            >
              {error ?? 'Initiate withdrawal'}
            </ButtonError>
          )}
          {preStakingInfo?.status === 2 && (
            <ButtonError disabled={!!error} error={!!error && !!preStakingInfo?.stakedAmount} onClick={onWithdraw}>
              {error ?? 'Withdraw'}
            </ButtonError>
          )}
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>
              {preStakingInfo?.status === 1 ? 'Initializing withdrawal of' : 'Finalizing withdrawal of'}{' '}
              {preStakingInfo?.stakedAmount?.toSignificant(4)} VAI
            </TYPE.body>
            <TYPE.body fontSize={20}>
              {preStakingInfo?.status === 1 ? 'Initializing claim of' : 'Finalizing claim of'}{' '}
              {preStakingInfo?.earnedAmount?.toSignificant(4)} VAI
            </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              {preStakingInfo?.status === 1 ? 'Initiate Withdrawal' : 'Execute Withdrawal'}
            </TYPE.body>
            <TYPE.body fontSize={20}></TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
