import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { TransactionResponse } from '@ethersproject/providers'

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
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { useDerivedUnstakeInfo } from 'state/stake/hooks'

interface WithdrawTokensModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: VaiStakingInfo
}

export default function WithdrawTokensModal({ isOpen, onDismiss, stakingInfo }: WithdrawTokensModalProps) {
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const [typedValue, setTypedValue] = useState('')
  const { parsedAmount, error: inputError } = useDerivedUnstakeInfo(typedValue, stakingInfo.stakedAmount)
  const atMaxAmount = Boolean(stakingInfo.stakedAmount && parsedAmount?.equalTo(stakingInfo.stakedAmount))

  const stakingContract = useVaiStakingContract(stakingInfo.stakingRewardAddress)

  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])

  const handleMax = useCallback(() => {
    stakingInfo?.stakedAmount && onUserInput(stakingInfo.stakedAmount?.toExact())
  }, [onUserInput, stakingInfo.stakedAmount])

  const onWithdraw = async () => {
    if (stakingContract && parsedAmount) {
      setAttempting(true)

      await stakingContract
        .withdraw(`0x${parsedAmount.raw.toString(16)}`, { gasLimit: 300000 })
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

  const handleDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Withdraw</TYPE.mediumHeader>
            <CloseIcon onClick={handleDismiss} />
          </RowBetween>
          {stakingInfo?.stakedAmount && (
            <>
              <AutoColumn justify="center" gap="md">
                <TYPE.body fontWeight={600} fontSize={36}>
                  {<FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount} />}
                </TYPE.body>
                <TYPE.body>Deposited VAI</TYPE.body>
              </AutoColumn>

              <CurrencyInputPanel
                value={typedValue}
                onUserInput={onUserInput}
                onMax={handleMax}
                showMaxButton={!atMaxAmount}
                currency={stakingInfo.stakedAmount.token}
                label={'Withdraw amount'}
                disableCurrencySelect={true}
                hideBalance
                id="withdraw-vai-token"
              />
            </>
          )}

          <TYPE.subHeader style={{ textAlign: 'center' }}>You can withdraw your stake deposit.</TYPE.subHeader>
          {stakingInfo && (
            <ButtonError disabled={!!inputError} error={!!inputError && !!parsedAmount} onClick={onWithdraw}>
              {inputError ?? 'Withdraw'}
            </ButtonError>
          )}
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={handleDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Withdrawing {parsedAmount?.toSignificant(4)} VAI</TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={handleDismiss} hash={hash}>
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

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`
