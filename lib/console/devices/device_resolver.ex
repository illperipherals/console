defmodule Console.Devices.DeviceResolver do
  alias Console.Repo
  alias Console.Devices.Device
  alias Console.DeviceStats
  alias Console.Helpers
  alias Console.Devices.DeviceImports
  alias Console.Events.Event
  alias Console.Labels
  alias Console.Labels.DevicesLabels
  import Ecto.Query
  alias Console.Alerts

  def paginate(%{page: page, page_size: page_size, column: column, order: order }, %{context: %{current_organization: current_organization}}) do
    order_by = {String.to_existing_atom(Helpers.order_with_nulls(order)), String.to_existing_atom(column)}

    devices = Device
      |> where([d], d.organization_id == ^current_organization.id)
      |> preload([:labels])
      |> order_by(^order_by)
      |> Repo.paginate(page: page, page_size: page_size)

    entries =
      devices.entries
      |> Enum.map(fn d ->
        Map.drop(d, [:app_key])
      end)

    {:ok, Map.put(devices, :entries, entries)}
  end

  def find(%{id: id}, %{context: %{current_organization: current_organization, current_membership: current_membership }}) do
    device = Ecto.assoc(current_organization, :devices) |> Repo.get!(id) |> Repo.preload([[labels: :config_profile], :config_profile])

    labels_with_config_profiles =
      device.labels
      |> Enum.filter(fn l -> l.config_profile_id != nil end)
      |> Enum.map(fn l -> l.id end)

    inherited_profile_label =
      case length(labels_with_config_profiles) do
        0 ->
          nil
        _ ->
          Labels.get_latest_applied_device_label(id, labels_with_config_profiles)
          |> Map.get(:label_id)
      end

    device =
      case current_membership.role do
        "read" ->
          device
          |> Map.drop([:app_key])
        _ -> device
      end

    {:ok, Map.put(device, :inherited_profile_label, inherited_profile_label)}
  end

  def get_device_stats(%{id: id}, %{context: %{current_organization: current_organization}}) do
    device = Ecto.assoc(current_organization, :devices) |> Repo.get!(id)

    stats_view =
      case DeviceStats.get_stats_view_for_device(device.id) do
        nil ->
          %{}
        result ->
          result
          |> Map.from_struct
          |> Enum.filter(fn {_, v} -> v != nil end)
          |> Enum.into(%{})
      end

    current_unix = DateTime.utc_now() |> DateTime.to_unix(:millisecond)
    unix1d = current_unix - 86400000

    {:ok, device_id} = Ecto.UUID.dump(device.id)
    result = Ecto.Adapters.SQL.query!(
      Console.Repo,
      "SELECT count(*) FROM device_stats where device_id = $1 and reported_at_epoch > $2",
      [device_id, unix1d]
    )
    counts = List.flatten(result.rows)

    {
      :ok,
      %{
        packets_last_1d: Enum.at(counts, 0),
        packets_last_7d: Enum.at(counts, 0) + Map.get(stats_view, :packets_7d, 0),
        packets_last_30d: Enum.at(counts, 0) + Map.get(stats_view, :packets_30d, 0),
      }
    }
  end

  def get_device_dc_stats(%{id: id}, %{context: %{current_organization: current_organization}}) do
    device = Ecto.assoc(current_organization, :devices) |> Repo.get!(id)

    stats_view =
      case DeviceStats.get_stats_view_for_device(device.id) do
        nil ->
          %{}
        result ->
          result
          |> Map.from_struct
          |> Enum.filter(fn {_, v} -> v != nil end)
          |> Enum.into(%{})
      end

    current_unix = DateTime.utc_now() |> DateTime.to_unix(:millisecond)
    unix1d = current_unix - 86400000

    {:ok, device_id} = Ecto.UUID.dump(device.id)
    result = Ecto.Adapters.SQL.query!(
      Console.Repo,
      "SELECT sum(dc_used) FROM device_stats where device_id = $1 and reported_at_epoch > $2",
      [device_id, unix1d]
    )
    sums = List.flatten(result.rows)
    dc_last_1d = Enum.at(sums, 0) || 0

    {
      :ok,
      %{
        dc_last_1d: dc_last_1d,
        dc_last_7d: dc_last_1d + Map.get(stats_view, :dc_7d, 0),
        dc_last_30d: dc_last_1d + Map.get(stats_view, :dc_30d, 0),
      }
    }
  end

  def get_device_count(_, %{context: %{current_organization: current_organization}}) do
    query = from d in Device,
      where: d.organization_id == ^current_organization.id,
      select: count(d.id)

    {:ok, %{ count: Repo.one(query) }}
  end

  def get_names(%{device_ids: device_ids}, %{context: %{current_organization: current_organization}}) do
    query = from d in Device,
      where: d.organization_id == ^current_organization.id and d.id in ^device_ids

    {:ok, query |> Repo.all()}
  end

  def all(_, %{context: %{current_organization: current_organization}}) do
    devices = Device
      |> where([d], d.organization_id == ^current_organization.id)
      |> preload([:labels])
      |> Repo.all()
      |> Enum.map(fn d ->
        Map.drop(d, [:app_key])
        |> Map.put(:alerts, Alerts.get_alerts_by_node(d.id, "device"))
      end)

    {:ok, devices}
  end

  def paginate_by_label(%{page: page, page_size: page_size, label_id: label_id, column: column, order: order}, %{context: %{current_organization: current_organization}}) do
    order_by = {String.to_existing_atom(Helpers.order_with_nulls(order)), String.to_existing_atom(column)}

    query = from d in Device,
      join: dl in DevicesLabels,
      on: dl.device_id == d.id,
      where: d.organization_id == ^current_organization.id and dl.label_id == ^label_id,
      preload: [:labels],
      order_by: ^order_by

    devices = query |> Repo.paginate(page: page, page_size: page_size)

    entries = devices.entries
      |> Enum.map(fn d ->
        Map.drop(d, [:app_key])
      end)

    {:ok, Map.put(devices, :entries, entries)}
  end

  def events(%{device_id: id}, %{context: %{current_organization: current_organization}}) do
    device = Device
      |> where([d], d.organization_id == ^current_organization.id and d.id == ^id)
      |> Repo.one!()

    events = Event
      |> where([e], e.device_id == ^device.id)
      |> limit(250)
      |> order_by(desc: :reported_at_naive)
      |> Repo.all()

    events =
      Enum.map(events, fn e ->
        data =
          case e.data do
            nil -> %{}
            _ -> Map.new(e.data, fn {k, v} -> {String.to_atom(k), v}
            end)
          end
        e |> Map.put(:data, Jason.encode!(data))
      end)

    {:ok, events}
  end

  def paginate_device_imports(%{page: page, page_size: page_size}, %{context: %{current_organization: current_organization}}) do
    device_imports = DeviceImports
      |> where([di], di.organization_id == ^current_organization.id)
      |> order_by([di], [desc: di.updated_at])
      |> Repo.paginate(page: page, page_size: page_size)

    {:ok, device_imports}
  end
end
