import { TableVirtuoso } from "react-virtuoso";
import {
  useMemo,
  useState,
  createContext,
  useContext,
  useReducer
} from "react";
import { Icon, MenuItem, Menu, Popover } from "@blueprintjs/core";
import { tables, columns } from "./roam-data";
import { MultiSelect } from "@blueprintjs/select";

const context = createContext();
const actionContext = createContext();

const reducer = (state = {}, action) => {
  const onFilterChange = (filter) => {
    const validFilterKeys = Object.keys(filter).filter((k) => filter[k].length);

    if (!validFilterKeys.length) {
      return state.table;
    }

    const r = state.table.filter((item) => {
      return validFilterKeys.every((k) => {
        return (
          item[k] &&
          filter[k] &&
          filter[k].some((v) => {
            console.log("filter = ", v, k, item[k]);
            return item[k].some((vi) => {
              return (vi.value + "").includes(v.value + "");
            });
          })
        );
      });
    });
    console.log(r, " = r");
    return r;
  };

  switch (action.type) {
    case "sort-ascending": {
      break;
    }
    case "sort-descending": {
      break;
    }
    case "filter": {
      break;
    }
    case "filter-change": {
      const r = action.payload(state.filterMap);
      state.filterMap = r;
      state.data = onFilterChange(r);

      break;
    }
    default: {
    }
  }
  console.log(state, action, " - reducer");
  return { ...state };
};
const Provider = context.Provider;

const useTableContext = () => {
  return useContext(context);
};

const useTableActionContext = () => {
  return useContext(actionContext);
};

function setFilterMap(dispatch, payload) {
  dispatch({
    type: "filter-change",
    payload
  });
}

function Filter(props) {
  const state = useTableContext();
  const dispatch = useTableActionContext();
  const columns = useMemo(() => {
    const newColumns = [...state.columns];
    state.data.forEach((item) => {
      newColumns.forEach((column) => {
        if (!column.items) {
          column.items = [];
        }
        item[column.dataIndex]
          ?.filter((v) => v?.value)
          .forEach((v) => {
            if (!column.items.some((ci) => ci.value === v.value)) {
              column.items.push(v);
            }
          });
      });
    });
    return newColumns;
  }, [props.data, props.columns]);

  const { filterMap } = state;
  console.log(filterMap, " = filterMap");
  return (
    <div>
      <strong>Filters</strong>
      <section title="filter" style={{ display: "flex" }}>
        {columns.map((column) => {
          const k = column.dataIndex;
          if (!filterMap[k]) {
            filterMap[k] = [];
          }
          return (
            <div>
              <Icon icon="menu" />
              {column.label}
              <Menu style={{ maxHeight: 300 }}>
                <MultiSelect
                  items={[...column.items]}
                  tagRenderer={(item) => {
                    return item.value;
                  }}
                  itemsEqual={(a, b) => a.value === b.value}
                  onItemSelect={(item) => {
                    const index = filterMap[k].findIndex(
                      (v) => v.value === item.value
                    );
                    if (index > -1) {
                      filterMap[k].splice(index, 1);
                      setFilterMap(dispatch, (prev) => ({
                        ...prev,
                        [k]: filterMap[k]
                      }));
                    } else {
                      filterMap[k].push(item);
                      setFilterMap(dispatch, (prev) => ({
                        ...prev,
                        [k]: filterMap[k]
                      }));
                    }
                  }}
                  selectedItems={filterMap[k]}
                  tagInputProps={{
                    onRemove: (item) => {
                      const index = filterMap[k].findIndex(
                        (v) => v.value === item
                      );
                      console.log(index, " __ remove __ ", k, item, filterMap);
                      setFilterMap(dispatch, (prev) => ({
                        ...prev,
                        [k]: prev[k].filter((v, i) => v.value !== item)
                      }));
                    }
                  }}
                  itemPredicate={(query, item) => {
                    if (!query) {
                      return true;
                    }
                    return (item.value + "")
                      .toLowerCase()
                      .includes(query.toLowerCase());
                  }}
                  itemRenderer={(item, itemProps) => {
                    return (
                      <MenuItem
                        key={item.value}
                        {...itemProps.modifiers}
                        onClick={itemProps.handleClick}
                        text={item.value}
                      ></MenuItem>
                    );
                  }}
                />
              </Menu>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function HeaderItemPopover({ data }) {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useTableActionContext();
  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      content={
        <Menu>
          <MenuItem
            text="Sort ascending"
            icon="arrow-up"
            onClick={() => {
              dispatch({
                type: "sort-ascending",
                payload: data
              });
            }}
          />
          <MenuItem
            text="Sort descending"
            icon="arrow-down"
            onClick={() => {
              dispatch({
                type: "sort-descending",
                payload: data
              });
            }}
          />
          <MenuItem
            text="Filter"
            icon="filter"
            onClick={() => {
              dispatch({
                type: "filter",
                payload: data
              });
            }}
          />
        </Menu>
      }
    >
      <th
        onClick={(event) => {
          setIsOpen(true);
          event.preventDefault();
        }}
        style={{ width: 150, background: "white" }}
      >
        {data.label}
      </th>
    </Popover>
  );
}

function Header({ columns }) {
  return (
    <tr>
      {columns.map((column) => {
        return <HeaderItemPopover data={column} />;
      })}
    </tr>
  );
}
export default function App() {
  const [state, dispatch] = useReducer(reducer, {
    table: tables,
    columns: columns,
    data: tables,
    filterMap: {}
  });
  return (
    <Provider value={state}>
      <actionContext.Provider value={dispatch}>
        <Filter />
        <TableVirtuoso
          style={{ height: 400 }}
          data={state.data}
          fixedHeaderContent={(fhc, args) => {
            return <Header columns={state.columns} />;
          }}
          itemContent={(index, user) => {
            return state.columns.map((column) => {
              return <td>{getLabel()}</td>;
              function getLabel() {
                if (!user?.[column.dataIndex]) {
                  return null;
                }
                return user[column.dataIndex].map((item) => {
                  return <div>{item.value}</div>;
                });
              }
            });
          }}
        />
      </actionContext.Provider>
    </Provider>
  );
}
