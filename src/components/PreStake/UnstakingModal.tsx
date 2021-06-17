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
  privateSale?: boolean | undefined
}

export default function UnstakingModal({ isOpen, onDismiss, preStakingInfo, privateSale }: StakingModalProps) {
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

  async function onWithdraw() {
    if (stakingContract && preStakingInfo?.stakedAmount) {
      setAttempting(true)
      if (privateSale) {
        await stakingContract
          .withdrawLockup({ gasLimit: 300000 })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Withdraw Private Sale`
            })
            setHash(response.hash)
          })
          .catch((error: any) => {
            setAttempting(false)
            console.log(error)
          })
      } else {
        await stakingContract
          .executeWithdrawal({ gasLimit: 300000 })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Withdraw`
            })
            setHash(response.hash)
          })
          .catch((error: any) => {
            setAttempting(false)
            console.log(error)
          })
      }
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
            <CloseIcon onClick={wrappedOndismiss} />
          </RowBetween>
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            Click the button below to upgrade your lockup to auto staking
          </TYPE.subHeader>
          {preStakingInfo && (
            <ButtonError disabled={!!error} error={!!error && !!preStakingInfo?.stakedAmount} onClick={onWithdraw}>
              {error ?? 'Upgrade to auto-staking'}
            </ButtonError>
          )}
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Withdrawing {preStakingInfo?.stakedAmount?.toSignificant(4)} VAI</TYPE.body>
            <TYPE.body fontSize={20}>Claiming {preStakingInfo?.earnedAmount?.toSignificant(4)} VAI</TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Withdraw</TYPE.body>
            <TYPE.body fontSize={20}></TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
