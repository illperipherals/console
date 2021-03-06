import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode"
import { Modal, Button, Typography } from "antd";
const { Text } = Typography;

export default ({ open, onClose, updateEuiPair }) => {
  const html5QrcodeScanner = useRef();

  useEffect(() => {
    if (open) {
      html5QrcodeScanner.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
      )
      html5QrcodeScanner.current.render(onScanSuccess, onScanFailure)
    } else {
      html5QrcodeScanner.current &&
      html5QrcodeScanner.current.html5Qrcode.isScanning &&
      html5QrcodeScanner.current.html5Qrcode.stop()
    }
  }, [open])

  useEffect(() => {
    return () => {
      html5QrcodeScanner.current &&
      html5QrcodeScanner.current.html5Qrcode.isScanning &&
      html5QrcodeScanner.current.html5Qrcode.stop()
    }
  }, [])

  const onScanSuccess = (decodedText) => {
    const euiString = decodedText.slice(6, 39)
    const euiPair = euiString.split(":")
    updateEuiPair(euiPair[1], euiPair[0])
    onClose()
  }

  const onScanFailure = (error) => {}

  return (
    <Modal
      title={"Scan/Import Device QR Code"}
      visible={open}
      onCancel={onClose}
      centered
      footer={[
        <Button key="back" onClick={onClose}>
          Back
        </Button>,
      ]}
    >
      <div id="reader"></div>
    </Modal>
  );
}
