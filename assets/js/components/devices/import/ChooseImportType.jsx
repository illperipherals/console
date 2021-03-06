import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Button, Typography, Popover } from "antd";
import { blueForDeviceStatsLarge } from "../../../util/colors";
import { scanGenericDevices } from "../../../actions/device";
import Warning from "../../../../img/warning.svg";
import ImportIcon from "../../../../img/device-import-icon.svg";
import DragAndDrop from "../../common/DragAndDrop";

const { Text, Title } = Typography;

const FormatPopover = () => (
  <Popover
    trigger="click"
    content={
      <Text style={{ display: "table", whiteSpace: "normal", width: 200 }}>
        The fields <b>DevEUI, AppEUI, AppKey,</b> and <b>Name</b> are all
        required. Optionally you can include a <b>LabelID</b> column and a <b>LabelID2</b> to add
        labels to imported devices.
      </Text>
    }
  >
    <a className="help-link" style={{ marginBottom: 20 }}>
      How do I format my .csv?
    </a>
  </Popover>
);

const ChooseImportType = ({
  onImportSelect,
  scanGenericDevices,
  genericImportScanFailed,
  deviceImports,
}) => {
  if (genericImportScanFailed)
    return (
      <Fragment>
        <img
          src={Warning}
          style={{ marginBottom: 10, height: 50, objectFit: "cover" }}
        />
        <Title style={{ fontSize: 26, width: "100%", textAlign: "center" }}>
          Invalid Filetype
        </Title>
        <Text
          style={{
            width: "100%",
            textAlign: "center",
            margin: "0px 40px 10px",
          }}
        >
          <b>
            Sorry. The file you supplied doesn’t appear to be formatted
            correctly.
          </b>
          <br />
          Please ensure it is a CSV file, with correctly formatted headers.
        </Text>
        <FormatPopover />
        <DragAndDrop
          fileSelected={(file) => {
            let fileReader = new FileReader();
            fileReader.onloadend = () => {
              scanGenericDevices(fileReader.result, (type) => {
                if (type) onImportSelect(type);
              });
            };
            fileReader.readAsText(file);
          }}
        >
          <Text
            style={{
              textAlign: "center",
              margin: "30px 80px",
              color: blueForDeviceStatsLarge,
            }}
          >
            Drag .csv file here or click to choose file
          </Text>
        </DragAndDrop>
      </Fragment>
    );
  return (
    <Fragment>
      <img
        src={ImportIcon}
        style={{ marginBottom: 10, height: 50, objectFit: "cover" }}
      />
      <Title style={{ fontSize: 26 }}>Import Devices</Title>
      <Text
        style={{ width: "100%", textAlign: "center", margin: "0px 40px 10px" }}
      >
        You can import your devices directly from the Things Network, or in bulk
        via .csv upload.
      </Text>
      <FormatPopover />
      {deviceImports &&
        (!deviceImports.entries.length ||
          deviceImports.entries[0].status !== "importing") && (
          <Fragment>
            <Button
              type="primary"
              onClick={() => onImportSelect("ttn")}
              style={{ width: "100%", marginLeft: 60, marginRight: 60 }}
            >
              Import from The Things Network
            </Button>
            <DragAndDrop
              fileSelected={(file) => {
                let fileReader = new FileReader();
                fileReader.onloadend = () => {
                  scanGenericDevices(fileReader.result, (type) => {
                    if (type) onImportSelect(type);
                  });
                };
                fileReader.readAsText(file);
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  margin: "30px 80px",
                  color: blueForDeviceStatsLarge,
                }}
              >
                Drag .csv file here or click to choose file
              </Text>
            </DragAndDrop>
          </Fragment>
        )}
    </Fragment>
  );
};

function mapStateToProps(state) {
  return {
    genericImportScanFailed: state.devices.genericImportScanFailed,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      scanGenericDevices,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(ChooseImportType);
