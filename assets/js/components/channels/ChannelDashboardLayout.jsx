import React, { Component } from "react";
import { connect } from "react-redux";
import withGql from "../../graphql/withGql";
import ChannelBar from "./ChannelBar";
import DashboardLayout from "../common/DashboardLayout";
import { ALL_CHANNELS } from "../../graphql/channels";
import HomeIcon from "../../../img/channels/channel-index-home-icon.svg";
import PlusIcon from "../../../img/channels/channel-index-plus-icon.svg";
import AllIcon from "../../../img/channels/channel-index-all-icon.svg";
import TableHeader from "../common/TableHeader";

class ChannelDashboardLayout extends Component {
  componentDidMount() {
    const { socket, currentOrganizationId } = this.props;

    this.channel = socket.channel("graphql:channel_index_bar", {});
    this.channel.join();
    this.channel.on(
      `graphql:channel_index_bar:${currentOrganizationId}:channel_list_update`,
      (message) => {
        const { refetch } = this.props.allChannelsQuery;
        refetch();
      }
    );

    if (!this.props.allChannelsQuery.loading) {
      const { refetch } = this.props.allChannelsQuery;
      refetch();
    }
  }

  componentWillUnmount() {
    this.channel.leave();
  }

  render() {
    const { allChannels, loading, error } = this.props.allChannelsQuery;

    return (
      <DashboardLayout title="My Integrations" user={this.props.user}>
        <TableHeader
          backgroundColor="#AAE8D9"
          goHome={() => this.props.history.push("/integrations/home")}
          otherColor="#7DD0BC"
          homeIcon={HomeIcon}
          goToAll={() => this.props.history.push("/integrations")}
          allIcon={AllIcon}
          textColor="#0CA47F"
          allText="All Integrations"
          allSubtext={allChannels && allChannels.length + " Integrations"}
          onHomePage={
            this.props.history.location.pathname === "/integrations/home"
          }
          onAllPage={this.props.history.location.pathname === "/integrations"}
          onNewPage={
            this.props.history.location.pathname === "/integrations/new"
          }
          addIcon={PlusIcon}
          goToNew={() => this.props.history.push("/integrations/new")}
          allButtonStyles={{ width: 134, minWidth: 134 }}
          extraContent={
            allChannels && (
              <ChannelBar
                shownChannelId={this.props.match.params.id}
                channels={allChannels || []}
              />
            )
          }
          newText="Add New Integration"
        >
          {this.props.children}
        </TableHeader>
      </DashboardLayout>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentOrganizationId: state.organization.currentOrganizationId,
    socket: state.apollo.socket,
  };
}

export default connect(
  mapStateToProps,
  null
)(
  withGql(ChannelDashboardLayout, ALL_CHANNELS, (props) => ({
    fetchPolicy: "cache-first",
    name: "allChannelsQuery",
  }))
);
