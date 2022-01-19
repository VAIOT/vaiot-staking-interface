import styled from 'styled-components'
import { AutoColumn } from '../Column'
import { JSBI, TokenAmount } from '@uniswap/sdk'
import { useActiveWeb3React } from '../../hooks'
import React, { useCallback, useState } from 'react'
import { useDerivedStakeInfo } from '../../state/stake/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { usePreStaking2Contract } from '../../hooks/useContract'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { TransactionResponse } from '@ethersproject/providers'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import { CloseIcon, TYPE } from '../../theme'
import CurrencyInputPanel from '../CurrencyInputPanel'
import { ButtonConfirmed, ButtonError } from '../Button'
import ProgressCircles from '../ProgressSteps'
import { LoadingView, SubmittedView } from '../ModalViews'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { PreStaking2Info } from '../../state/prestake-2.0/hooks'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface PreStakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  preStakingInfo: PreStaking2Info
  userVaiUnstaked: TokenAmount | undefined
}

export default function PreStaking2Modal({ isOpen, onDismiss, preStakingInfo, userVaiUnstaked }: PreStakingModalProps) {
  const { library, account } = useActiveWeb3React()

  const [typedValue, setTypedValue] = useState('')
  const { parsedAmount, error } = useDerivedStakeInfo(typedValue, preStakingInfo.stakedAmount.token, userVaiUnstaked)
  // const parsedAmountWrapped = wrappedCurrencyAmount(parsedAmount, chainId)
  const addTransaction = useTransactionAdder()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  const stakingContract = usePreStaking2Contract(preStakingInfo.stakingRewardAddress)

  const deadline = useTransactionDeadline()
  const [approval, approveCallback] = useApproveCallback(parsedAmount, preStakingInfo.stakingRewardAddress)

  async function onStake() {
    setAttempting(true)
    if (stakingContract && parsedAmount) {
      if (deadline) {
        if (approval === ApprovalState.APPROVED) {
          await stakingContract
            .deposit(`0x${parsedAmount.raw.toString(16)}`, { gasLimit: 350000 })
            .then((response: TransactionResponse) => {
              addTransaction(response, {
                summary: `Deposit VAI`
              })
              setHash(response.hash)
            })
            .catch((error: any) => {
              setAttempting(false)
              console.log(error)
            })
        } else {
          setAttempting(false)
          throw new Error('Attempting to stake without approval or a signature. Please contact support.')
        }
      }
    }
  }
  async function onAttemptToApprove() {
    if (!library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmount
    if (!liquidityAmount) throw new Error('missing liquidity amount')
    return approveCallback()
  }
  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])
  const maxAmountInput = preStakingInfo.currentStakingLimit.subtract(preStakingInfo.totalStakedAmount)
  const currencyBalance = useCurrencyBalance(account ?? undefined, preStakingInfo.stakedAmount.token ?? undefined)
  const selectedCurrencyBalance = currencyBalance
  const atMaxAmount = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const handleMax = useCallback(() => {
    maxAmountInput &&
      onUserInput(
        !selectedCurrencyBalance
          ? maxAmountInput.toExact()
          : maxAmountInput.greaterThan(JSBI.BigInt(selectedCurrencyBalance.toFixed(0)))
          ? selectedCurrencyBalance?.toExact()
          : maxAmountInput.toExact()
      )
  }, [maxAmountInput, onUserInput, selectedCurrencyBalance])
  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Deposit</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <CurrencyInputPanel
            value={typedValue}
            onUserInput={onUserInput}
            onMax={handleMax}
            showMaxButton={!atMaxAmount}
            currency={preStakingInfo.stakedAmount.token}
            label={''}
            disableCurrencySelect={true}
            customBalanceText={'Available to deposit: '}
            selectedCurrencyBalance={selectedCurrencyBalance}
            id="stake-vai-token"
          />

          <RowBetween>
            <ButtonConfirmed
              mr="0.5rem"
              onClick={onAttemptToApprove}
              confirmed={approval === ApprovalState.APPROVED}
              disabled={approval !== ApprovalState.NOT_APPROVED}
            >
              Approve
            </ButtonConfirmed>

            <ButtonError
              disabled={!!error || approval !== ApprovalState.APPROVED}
              error={!!error && !!parsedAmount}
              onClick={onStake}
            >
              {error ?? 'Deposit'}
            </ButtonError>
          </RowBetween>
          <ProgressCircles steps={[approval === ApprovalState.APPROVED]} disabled={true} />
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Depositing VAI</TYPE.largeHeader>
            <TYPE.body fontSize={20}>{parsedAmount?.toSignificant(4)} VAI</TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Deposited {parsedAmount?.toSignificant(4)} VAI</TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
