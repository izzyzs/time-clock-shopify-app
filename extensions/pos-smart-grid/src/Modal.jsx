// @ts-nocheck
import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
const API_BASE_URL = "https://pos-smart-grid-production.up.railway.app";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { i18n } = shopify;
  // Employee as the following
  /**{
    active: boolean;
    code: string;
    first_name: string;
    id: number;
    last_name: string;
} */
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(undefined);
  const [clockedInEmployees, setClockedInEmployees] = useState([]);
  const [pin, setPin] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * @param {string | number | Date} iso
   */
  function formatTime(iso) {
    // console.log("formatTime func");
    // console.log("***START***");
    if (!iso) return "—";
    const d = new Date(iso);
    // console.log("iso", iso);
    // console.log(d.toLocaleTimeString());
    const time = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    // console.log("***END***");
    return time;
  }

  useEffect(() => {
    console.log("selectedEmployee", selectedEmployee);
  }, [selectedEmployee]);

  const resetValues = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setPin("");
  };

  const retrieveEmployees = async () => {
    setClockedInEmployees([]);
    setEmployees([]);
    setIsLoading(true);
    setPin("");
    setSelectedEmployee(undefined);
    try {
      const token = await shopify.session.getSessionToken();

      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json().catch(() => ({}));
      setEmployees(data.employees);
      setClockedInEmployees(
        data.employees.filter((e) => e.is_clocked_in === true),
      );
    } catch (error) {
      console.error("fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!errorMsg) return;

    const timerId = setTimeout(() => {
      setErrorMsg("");
    }, 5000);

    return () => clearTimeout(timerId);
  }, [errorMsg]);

  useEffect(() => {
    retrieveEmployees();
  }, []);

  useEffect(() => {
    if (successMsg) shopify.toast.show(successMsg, { duration: 5000 });
  }, [successMsg]);

  const clockIn = async () => {
    setIsLoading(true);
    try {
      const token = await shopify.session.getSessionToken();

      const now = new Date().toISOString();

      console.log("new Date().toISOString():", new Date().toISOString());
      console.log("now:", now);
      const data = {
        selectedEmployeeId: selectedEmployee.id,
        now: now,
        pin,
      };
      console.log("clock in data", data);
      const res = await fetch("/api/time-entry/clock-in", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to clock in");
      }
      setSuccessMsg(
        `${selectedEmployee.first_name} ${selectedEmployee.last_name} clocked in successfully at ${formatTime(now)}.`,
      );
      setPin("");
      setSelectedEmployee(undefined);
      await retrieveEmployees();
    } catch (error) {
      setErrorMsg(error);
      console.error("fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clockOut = async () => {
    setIsLoading(true);
    try {
      const token = await shopify.session.getSessionToken();

      const now = new Date().toISOString();
      const res = await fetch("/api/time-entry/clock-out", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedEmployeeId: selectedEmployee.id,
          pin,
          now,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to clock out");
      }
      console.log(
        "/api/time-entry/clock-out response status",
        res.status,
        res.statusText,
      );
      setSuccessMsg(
        `${selectedEmployee.first_name} ${selectedEmployee.last_name} clocked out successfully at ${formatTime(now)}.`,
      );
      setPin("");
      setSelectedEmployee(undefined);
      await retrieveEmployees();
    } catch (error) {
      setErrorMsg(error);
      console.error("fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (console.log("pin", pin), [pin]);
  });

  return (
    <s-page heading={i18n.translate("modal_heading")}>
      <s-scroll-box>
        {errorMsg && (
          <s-banner heading={errorMsg} tone="warning">
            <s-button slot="primary-action">Dismiss</s-button>
          </s-banner>
        )}
        <s-box padding="small">
          {/* {isLoading && <s-spinner accessibilityLabel="Loading content" />} */}
          <s-box padding="small">
            {employees ? (
              employees.length > 0 ? (
                <s-choice-list
                  onChange={(event) => {
                    console.log(
                      "onChange for selected employee:",
                      event.currentTarget.values,
                    );
                    setSelectedEmployee(
                      employees.find(
                        (e) => e.id == event.currentTarget.values[0],
                      ),
                    );
                    console.log("value of selectedEmployee", selectedEmployee);
                  }}
                >
                  {employees.map((e, idx) => {
                    return (
                      <s-choice
                        value={`${e.id}`}
                        key={idx}
                      >{`${e.code}: ${e.first_name} ${e.last_name}`}</s-choice>
                    );
                  })}
                </s-choice-list>
              ) : (
                <s-text>No employees found</s-text>
              )
            ) : (
              <s-spinner accessibilityLabel="Loading content" />
            )}
          </s-box>
          {selectedEmployee && (
            <>
              <s-text-field
                label="Pin number (required)"
                disabled={true}
                value={pin}
                // onInput={(event) => {
                //   console.log(event.currentTarget.value);
                //   setPin(event.currentTarget.value);
                // }}
              ></s-text-field>
              {/* <input
                type={`password`}
                placeholder={`Enter your pin`}
                value={pin}
                onChange={(e) => {
                  console.log(e.target.value);
                  setPin(e.target.value);
                }}
              ></input> */}
              <PinPad pin={pin} setPin={setPin} />
              {!selectedEmployee.is_clocked_in ? (
                <s-button variant="primary" onClick={clockIn}>
                  Clock in
                </s-button>
              ) : (
                <s-button variant="secondary" onClick={clockOut}>
                  Clock out
                </s-button>
              )}
            </>
          )}
          <s-divider />
          <s-box padding="small">
            {clockedInEmployees && (
              <>
                <s-heading>Clocked in</s-heading>
                {clockedInEmployees.map((c, idx) => (
                  <s-text>{`${c.first_name} ${c.last_name}`}</s-text>
                ))}
              </>
            )}
          </s-box>
        </s-box>
      </s-scroll-box>
    </s-page>
  );
}

const PinPad = ({ pin, setPin }) => {
  return (
    <s-box>
      <s-stack direction="inline" gap="small" justifyContent="center">
        <s-button
          onClick={setPin(() => {
            return pin + "1";
          })}
        >
          1
        </s-button>
        <s-button
          onClick={setPin(() => {
            return pin + "2";
          })}
        >
          2
        </s-button>
        <s-button
          onClick={setPin(() => {
            return pin + "3";
          })}
        >
          3
        </s-button>
      </s-stack>
      <s-stack direction="inline" gap="small" justifyContent="center">
        <s-button
          onClick={setPin(() => {
            return pin + "4";
          })}
        >
          4
        </s-button>
        <s-button
          onClick={setPin(() => {
            return pin + "5";
          })}
        >
          5
        </s-button>
        <s-button
          onClick={setPin(() => {
            return pin + "6";
          })}
        >
          6
        </s-button>
      </s-stack>
      <s-stack direction="inline" gap="small" justifyContent="center">
        <s-button
          onClick={setPin(() => {
            return pin + "7";
          })}
        >
          7
        </s-button>
        <s-button
          onClick={setPin(() => {
            return pin + "8";
          })}
        >
          8
        </s-button>
        <s-button
          onClick={setPin(() => {
            return pin + "9";
          })}
        >
          9
        </s-button>
      </s-stack>
      <s-stack direction="inline" gap="small" justifyContent="center">
        <s-button
          onClick={setPin(() => {
            return pin.slice(0, -1);
          })}
        >
          &larr;
        </s-button>
        <s-button
          onClick={setPin(() => {
            return pin + "0";
          })}
        >
          0
        </s-button>
      </s-stack>
    </s-box>
  );
};
