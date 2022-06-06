import React, {createContext, useReducer} from 'react';

export const Context = createContext();

const ContextProvider = ({children}) => {
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'SIGN_IN':
          return {...state, token: action.token};
        case 'SIGN_OUT':
          return {...state, isSignout: true, token: null};
        case 'RESTORE_TOKEN':
          return {...state, isSignout: false, token: action.token};
        case 'RESET':
          return {...state};
        case 'PRODUCT_SEARCH':
          return {...state};

        default:
          return state;
      }
    },
    {
      api: 'http://musasoft.ddns.net:8080/',
      isLoading: true,
      isSignout: false,
      token: null,
      productBarcode: null,
    },
  );

  return (
    <Context.Provider value={{state, dispatch}}>{children}</Context.Provider>
  );
};

export default ContextProvider;
