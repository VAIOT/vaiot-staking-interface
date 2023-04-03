import React, { useCallback, useState } from 'react'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { useVaiStakingContract } from '../../hooks/useContract'
import { LoadingView, SubmittedView } from '../ModalViews'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
import { useActiveWeb3React } from '../../hooks'
import { VaiStakingInfo } from 'state/vai-stake/hooks'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useDerivedUnstakeInfo } from 'state/stake/hooks'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

export interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: VaiStakingInfo
}

export default function WithdrawTokensStagesModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account } = useActiveWeb3React()

  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [typedValue, setTypedValue] = useState('')

  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])

  const handleMax = useCallback(() => {
    stakingInfo?.stakedAmount && onUserInput(stakingInfo.stakedAmount?.toExact())
  }, [onUserInput, stakingInfo.stakedAmount])
  const { parsedAmount } = useDerivedUnstakeInfo(typedValue, stakingInfo.stakedAmount)
  const atMaxAmount = Boolean(stakingInfo.stakedAmount && parsedAmount?.equalTo(stakingInfo.stakedAmount))

  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useVaiStakingContract(stakingInfo.stakingRewardAddress)

  async function onWithdraw() {
    if (stakingContract && stakingInfo?.stakedAmount && parsedAmount) {
      console.log('claimWithdrawal', stakingInfo?.timeLeftToWithdraw, stakingInfo?.withdrawalInitiated)
      if (stakingInfo?.withdrawalInitiated) {
        setAttempting(true)
        await stakingContract
          .claimWithdrawal(`0x${parsedAmount.raw.toString(16)}`, { gasLimit: 300000 })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Withdraw deposited liquidity`
            })
            setHash(response.hash)
            setTypedValue('')
          })
          .catch((error: any) => {
            setAttempting(false)
            console.log(error)
          })
      } else {
        console.log('initializeWithdrawal')
        await stakingContract
          .initializeWithdrawal({ gasLimit: 300000 })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Withdrawal initialized`
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
  if (!stakingInfo?.stakedAmount) {
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
          {stakingInfo?.stakedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount} />}
              </TYPE.body>
              <TYPE.body>Deposited liquidity:</TYPE.body>
            </AutoColumn>
          )}
          {stakingInfo?.earnedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={stakingInfo?.earnedAmount} />}
              </TYPE.body>
              <TYPE.body>Unclaimed VAI</TYPE.body>
            </AutoColumn>
          )}

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

          <TYPE.subHeader style={{ textAlign: 'center' }}>
            {stakingInfo?.timeLeftToWithdraw
              ? 'Grace period ended. You can now withdraw your liquidity.'
              : 'If you want to withdraw your liquidity, you have to initialise the process, which means that counting your rewards will stop immediately and you will be able to withdraw your LP Tokens after 7 days grace period.'}
          </TYPE.subHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onWithdraw}>
            {error ?? stakingInfo?.timeLeftToWithdraw ? 'Withdraw & Claim' : 'Initialize Withdraw'}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Withdrawing {stakingInfo?.stakedAmount?.toSignificant(4)} VAI</TYPE.body>
            <TYPE.body fontSize={20}>Claiming {stakingInfo?.earnedAmount?.toSignificant(4)} UNI-V2</TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Withdrew VAI!</TYPE.body>
            <TYPE.body fontSize={20}>Claimed UNI-V2!</TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
