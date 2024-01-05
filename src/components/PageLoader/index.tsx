import Loader from 'components/Loader'
import React from 'react'

import styled from 'styled-components'

const PageLoaderContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  display: flex;
  justify-content: center;
  z-index: 100;
  padding-top: 25vh;
  backdrop-filter: blur(4px);
`

export default function PageLoader(rest: { [k: string]: any }) {
  return (
    <PageLoaderContainer {...rest}>
      <Loader size="75px" stroke="#c0c2c7" />
    </PageLoaderContainer>
  )
}
