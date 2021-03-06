defmodule ConsoleWeb.FunctionView do
  use ConsoleWeb, :view
  alias ConsoleWeb.FunctionView

  def render("index.json", %{functions: functions}) do
    render_many(functions, FunctionView, "function.json")
  end

  def render("show.json", %{function: function}) do
    render_one(function, FunctionView, "function.json")
  end

  def render("function.json", %{function: function}) do
    %{
      id: function.id,
      name: function.name,
      type: function.type,
      format: function.format,
      body: function.body,
      active: function.active,
      updated_at: function.updated_at
    }
  end
end
