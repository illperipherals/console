defmodule Console.Repo.Migrations.AddCfListSettingToDevices do
  use Ecto.Migration

  def change do
    alter table(:devices) do
      add :cf_list_enabled, :boolean, null: false, default: true
    end
  end
end
