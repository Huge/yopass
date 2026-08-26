import { useState } from 'react';
import { faCopy, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCopyToClipboard } from 'react-use';
import { QRCodeSVG } from 'qrcode.react';
import {
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Box,
  Collapse,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

type ResultProps = {
  readonly uuid: string;
  readonly password: string;
  readonly prefix: 's' | 'f';
  readonly customPassword?: boolean;
};

const Result = ({ uuid, password, prefix, customPassword }: ResultProps) => {
  const base =
    (process.env.PUBLIC_URL ||
      `${window.location.protocol}//${window.location.host}`) + `/#/${prefix}`;
  const short = `${base}/${uuid}`;
  const full = `${short}/${password}`;
  const { t } = useTranslation();

  const [showQr, setShowQr] = useState<boolean>(false);
  const [activeQrValue, setActiveQrValue] = useState<string>(full);
  const [activeQrLabel, setActiveQrLabel] = useState<string>(
    customPassword ? t('result.rowLabelShortLink') : t('result.rowLabelOneClick'),
  );

  const handleToggleQr = (value: string, label: string) => {
    if (showQr && activeQrValue === value) {
      setShowQr(false);
    } else {
      setActiveQrValue(value);
      setActiveQrLabel(label);
      setShowQr(true);
    }
  };

  return (
    <Box>
      <Typography variant="h4">{t('result.title')}</Typography>
      <Typography>
        {t('result.subtitleDownloadOnce')}
        <br />
        {t('result.subtitleChannel')}
      </Typography>
      <TableContainer>
        <Table>
          <TableBody>
            {!customPassword && (
              <Row
                label={t('result.rowLabelOneClick')}
                value={full}
                onShowQr={() =>
                  handleToggleQr(full, t('result.rowLabelOneClick'))
                }
                isQrActive={showQr && activeQrValue === full}
              />
            )}
            <Row
              label={t('result.rowLabelShortLink')}
              value={short}
              onShowQr={() =>
                handleToggleQr(short, t('result.rowLabelShortLink'))
              }
              isQrActive={showQr && activeQrValue === short}
            />
            <Row label={t('result.rowLabelDecryptionKey')} value={password} />
          </TableBody>
        </Table>
      </TableContainer>

      <Collapse in={showQr}>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              {activeQrLabel} — {t('result.qrCodeTitle', 'QR Code')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, textAlign: 'center' }}
            >
              {t('result.qrSubtitle', 'Scan with a mobile camera to decrypt and open')}
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: '#ffffff',
                borderRadius: 2,
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                display: 'inline-flex',
              }}
            >
              <QRCodeSVG
                value={activeQrValue}
                size={220}
                level="M"
                includeMargin={false}
              />
            </Box>
          </Paper>
        </Box>
      </Collapse>
    </Box>
  );
};

type RowProps = {
  readonly label: string;
  readonly value: string;
  readonly onShowQr?: () => void;
  readonly isQrActive?: boolean;
};

const Row = ({ label, value, onShowQr, isQrActive }: RowProps) => {
  const [copy, copyToClipboard] = useCopyToClipboard();
  const { t } = useTranslation();

  return (
    <TableRow key={label}>
      <TableCell width="90">
        <Stack direction="row" spacing={1}>
          <Tooltip title={t('result.buttonCopy', 'Copy to clipboard')}>
            <Button
              color={copy.error ? 'secondary' : 'primary'}
              variant="contained"
              size="small"
              onClick={() => copyToClipboard(value)}
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </Tooltip>
          {onShowQr && (
            <Tooltip
              title={
                isQrActive
                  ? t('result.buttonHideQr', 'Hide QR Code')
                  : t('result.buttonShowQr', 'Show QR Code')
              }
            >
              <Button
                color={isQrActive ? 'secondary' : 'primary'}
                variant={isQrActive ? 'contained' : 'outlined'}
                size="small"
                onClick={onShowQr}
              >
                <FontAwesomeIcon icon={faQrcode} />
              </Button>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
      <TableCell width="130" padding="none">
        <strong>{label}</strong>
      </TableCell>
      <TableCell sx={{ wordBreak: 'break-all' }}>{value}</TableCell>
    </TableRow>
  );
};

export default Result;
