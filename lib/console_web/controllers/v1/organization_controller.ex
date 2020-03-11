defmodule ConsoleWeb.V1.OrganizationController do
  use ConsoleWeb, :controller
  alias Console.Repo
  import Ecto.Query

  action_fallback(ConsoleWeb.FallbackController)

  plug CORSPlug, origin: "*"

  def show(conn, _) do
    render(conn, "show.json", organization: conn.assigns.current_organization)
  end
end
