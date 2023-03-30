import { useCallback, useEffect, useMemo, useState } from 'react'
import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, JSBI, Token, TokenAmount } from '@uniswap/sdk'

import { useActiveWeb3React } from '../../hooks'
import { ApprovalState } from '../../hooks/useApproveCallback'
import { useTokenContract } from '../../hooks/useContract'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { calculateGasMargin } from '../../utils'

export const useVaiApprovalState = (
  amountToApprove: CurrencyAmount | undefined,
  spenderAddress: string,
  token: Token
) => {
  const { account } = useActiveWeb3React()
  const tokenContract = useTokenContract(token.address)
  const addTransaction = useTransactionAdder()

  const [currentAllowance, setCurrentAllowance] = useState(new TokenAmount(token, '0'))
  const [pendingApproval, setPendingApproval] = useState(false)

  const getAllowance = useCallback(async () => {
    if (tokenContract && account) {
      setPendingApproval(true)
      tokenContract
        .allowance(account, spenderAddress)
        .then((result: BigNumber) => {
          setCurrentAllowance(new TokenAmount(token, result?.toString() ?? '0'))
          setPendingApproval(false)
        })
        .catch(() => {
          JSBI.BigInt(0)
          setPendingApproval(false)
        })
    }
  }, [account, tokenContract, spenderAddress, token])

  useEffect(() => {
    getAllowance()
  }, [getAllowance])

  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spenderAddress) return ApprovalState.UNKNOWN

    if (!currentAllowance) return ApprovalState.UNKNOWN

    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spenderAddress])

  const approve = useCallback(async () => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spenderAddress) {
      console.error('no spender')
      return
    }

    const estimatedGas = await tokenContract.estimateGas.approve(spenderAddress, MaxUint256).catch(() => {
      return tokenContract.estimateGas.approve(spenderAddress, amountToApprove.raw.toString())
    })

    setPendingApproval(true)
    try {
      const transaction: TransactionResponse = await tokenContract.approve(
        spenderAddress,
        amountToApprove.raw.toString(),
        {
          gasLimit: calculateGasMargin(estimatedGas)
        }
      )

      addTransaction(transaction, {
        summary: 'Approve ' + amountToApprove.currency.symbol,
        approval: { tokenAddress: token.address, spender: spenderAddress }
      })

      await transaction.wait()

      getAllowance()
    } catch (error) {
      console.debug('Failed to approve token', error)
      throw error
    } finally {
      setPendingApproval(false)
    }
  }, [addTransaction, amountToApprove, approvalState, getAllowance, spenderAddress, token, tokenContract])

  return [approvalState, approve] as const
}
