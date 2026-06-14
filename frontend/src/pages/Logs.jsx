import { useEffect, useState } from "react";
import { getCommunicationLogs } from "../services/api";

function Logs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res =
        await getCommunicationLogs();

      setLogs(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.customer_id
        .toString()
        .includes(search) ||
      log.campaign_id
        .toString()
        .includes(search);

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : log.status === statusFilter;

    return (
      matchesSearch &&
      matchesStatus
    );
  });

  return (
    <div className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Communication Logs
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

        <div className="flex gap-4 mb-6">

          <input
            type="text"
            placeholder="Search Campaign ID or Customer ID"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border rounded-xl p-3 flex-1"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border rounded-xl p-3"
          >
            <option value="ALL">
              All
            </option>

            <option value="SENT">
              SENT
            </option>

            <option value="FAILED">
              FAILED
            </option>

          </select>

        </div>

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left p-4">
                Log ID
              </th>

              <th className="text-left p-4">
                Campaign
              </th>

              <th className="text-left p-4">
                Customer
              </th>

              <th className="text-left p-4">
                Status
              </th>

              <th className="text-left p-4">
                Sent At
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredLogs.map((log) => (

              <tr
                key={log.id}
                className="border-b"
              >

                <td className="p-4">
                  {log.id}
                </td>

                <td className="p-4">
                  {log.campaign_id}
                </td>

                <td className="p-4">
                  {log.customer_id}
                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full text-white ${
                      log.status === "SENT"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {log.status}
                  </span>

                </td>

                <td className="p-4">
                  {new Date(
                    log.sent_at
                  ).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Logs;