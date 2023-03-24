import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'
import { SupportedChainId } from 'constants/chains'

const ETH_NETWORK_URL = process.env.REACT_APP_ETH_NETWORK_URL
const MUMBAI_NETWORK_URL = process.env.REACT_APP_MUMBAI_NETWORK_URL
const POLYGON_NETWORK_URL = process.env.REACT_APP_POLYGON_NETWORK_URL
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '1')

if (typeof ETH_NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_ETH_NETWORK_URL must be a defined environment variable`)
}

if (typeof POLYGON_NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_POLYGON_NETWORK_URL must be a defined environment variable`)
}

const RPC_URLS: Record<number, string> = {
  [SupportedChainId.MAINNET]: ETH_NETWORK_URL,
  [SupportedChainId.POLYGON]: POLYGON_NETWORK_URL,
  ...(MUMBAI_NETWORK_URL ? ({ [SupportedChainId.MUMBAI]: MUMBAI_NETWORK_URL } as Record<number, string>) : {})
}

export const network = new NetworkConnector({
  urls: RPC_URLS,
  defaultChainId: 80001
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds: [SupportedChainId.MAINNET, SupportedChainId.POLYGON, SupportedChainId.MUMBAI]
})

// mainnet only
export const walletconnect = new WalletConnectConnector({
  rpc: RPC_URLS,
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: SupportedChainId.MAINNET
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [SupportedChainId.MAINNET]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: ETH_NETWORK_URL,
  appName: 'Uniswap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})
