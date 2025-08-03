import styled from 'styled-components';
import { remSize } from '../../theme';
import Button from '../Button';

export const ButtonWrapper = styled(Button)`
  width: ${remSize(48)};
  > svg {
    width: 100%;
    height: 100%;
  }
`;
