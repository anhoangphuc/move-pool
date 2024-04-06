export type MovePool = {
  version: "0.1.0";
  name: "move_pool";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "globalState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "moveToken";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vaultMoveAta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "program";
          isMut: false;
          isSigner: false;
        },
        {
          name: "programData";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "depositSol";
      accounts: [
        {
          name: "globalState";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "depositMove";
      accounts: [
        {
          name: "globalState";
          isMut: false;
          isSigner: false;
        },
        {
          name: "moveToken";
          isMut: false;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userAta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vaultAta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "swapSolToMove";
      accounts: [
        {
          name: "globalState";
          isMut: false;
          isSigner: false;
        },
        {
          name: "moveToken";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userAta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vaultAta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amountIn";
          type: "u64";
        }
      ];
    },
    {
      name: "swapMoveToSol";
      accounts: [
        {
          name: "globalState";
          isMut: false;
          isSigner: false;
        },
        {
          name: "moveToken";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userAta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vaultAta";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amountIn";
          type: "u64";
        }
      ];
    },
    {
      name: "setConfig";
      accounts: [
        {
          name: "globalState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "admin";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "admin";
          type: {
            option: "publicKey";
          };
        },
        {
          name: "isPending";
          type: {
            option: "bool";
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "globalState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            docs: ["Address of the admin address, used for set pending status"];
            type: "publicKey";
          },
          {
            name: "moveToken";
            docs: ["Address of the move_token"];
            type: "publicKey";
          },
          {
            name: "isPending";
            docs: ["Pending status of the pool, paused in case of emergency"];
            type: "bool";
          }
        ];
      };
    },
    {
      name: "vault";
      type: {
        kind: "struct";
        fields: [
          {
            name: "solAmount";
            docs: ["The deposited SOL amount"];
            type: "u64";
          },
          {
            name: "moveAmount";
            docs: ["The deposited MOVE amount"];
            type: "u64";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "DepositSol";
      fields: [
        {
          name: "amount";
          type: "u64";
          index: false;
        },
        {
          name: "user";
          type: "publicKey";
          index: false;
        }
      ];
    },
    {
      name: "DepositMove";
      fields: [
        {
          name: "amount";
          type: "u64";
          index: false;
        },
        {
          name: "userAta";
          type: "publicKey";
          index: false;
        }
      ];
    },
    {
      name: "SwapSolToMove";
      fields: [
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "solIn";
          type: "u64";
          index: false;
        },
        {
          name: "userMoveAta";
          type: "publicKey";
          index: false;
        },
        {
          name: "moveOut";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "SwapMoveToSol";
      fields: [
        {
          name: "userMoveAta";
          type: "publicKey";
          index: false;
        },
        {
          name: "moveIn";
          type: "u64";
          index: false;
        },
        {
          name: "user";
          type: "publicKey";
          index: false;
        },
        {
          name: "solOut";
          type: "u64";
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "NotAuthorized";
      msg: "Not Authorized";
    },
    {
      code: 6001;
      name: "ZeroAmountIn";
      msg: "ZeroAmountIn";
    },
    {
      code: 6002;
      name: "ZeroAmountOut";
      msg: "ZeroAmountOut";
    },
    {
      code: 6003;
      name: "NotEnoughBalance";
      msg: "NotEnoughBalance";
    },
    {
      code: 6004;
      name: "MathError";
      msg: "MathError";
    },
    {
      code: 6005;
      name: "Pending";
      msg: "Pending";
    }
  ];
};

export const IDL: MovePool = {
  version: "0.1.0",
  name: "move_pool",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "globalState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "moveToken",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vaultMoveAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "programData",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "depositSol",
      accounts: [
        {
          name: "globalState",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "depositMove",
      accounts: [
        {
          name: "globalState",
          isMut: false,
          isSigner: false,
        },
        {
          name: "moveToken",
          isMut: false,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vaultAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "swapSolToMove",
      accounts: [
        {
          name: "globalState",
          isMut: false,
          isSigner: false,
        },
        {
          name: "moveToken",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vaultAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amountIn",
          type: "u64",
        },
      ],
    },
    {
      name: "swapMoveToSol",
      accounts: [
        {
          name: "globalState",
          isMut: false,
          isSigner: false,
        },
        {
          name: "moveToken",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vaultAta",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amountIn",
          type: "u64",
        },
      ],
    },
    {
      name: "setConfig",
      accounts: [
        {
          name: "globalState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "admin",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "admin",
          type: {
            option: "publicKey",
          },
        },
        {
          name: "isPending",
          type: {
            option: "bool",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "globalState",
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            docs: ["Address of the admin address, used for set pending status"],
            type: "publicKey",
          },
          {
            name: "moveToken",
            docs: ["Address of the move_token"],
            type: "publicKey",
          },
          {
            name: "isPending",
            docs: ["Pending status of the pool, paused in case of emergency"],
            type: "bool",
          },
        ],
      },
    },
    {
      name: "vault",
      type: {
        kind: "struct",
        fields: [
          {
            name: "solAmount",
            docs: ["The deposited SOL amount"],
            type: "u64",
          },
          {
            name: "moveAmount",
            docs: ["The deposited MOVE amount"],
            type: "u64",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "DepositSol",
      fields: [
        {
          name: "amount",
          type: "u64",
          index: false,
        },
        {
          name: "user",
          type: "publicKey",
          index: false,
        },
      ],
    },
    {
      name: "DepositMove",
      fields: [
        {
          name: "amount",
          type: "u64",
          index: false,
        },
        {
          name: "userAta",
          type: "publicKey",
          index: false,
        },
      ],
    },
    {
      name: "SwapSolToMove",
      fields: [
        {
          name: "user",
          type: "publicKey",
          index: false,
        },
        {
          name: "solIn",
          type: "u64",
          index: false,
        },
        {
          name: "userMoveAta",
          type: "publicKey",
          index: false,
        },
        {
          name: "moveOut",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "SwapMoveToSol",
      fields: [
        {
          name: "userMoveAta",
          type: "publicKey",
          index: false,
        },
        {
          name: "moveIn",
          type: "u64",
          index: false,
        },
        {
          name: "user",
          type: "publicKey",
          index: false,
        },
        {
          name: "solOut",
          type: "u64",
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "NotAuthorized",
      msg: "Not Authorized",
    },
    {
      code: 6001,
      name: "ZeroAmountIn",
      msg: "ZeroAmountIn",
    },
    {
      code: 6002,
      name: "ZeroAmountOut",
      msg: "ZeroAmountOut",
    },
    {
      code: 6003,
      name: "NotEnoughBalance",
      msg: "NotEnoughBalance",
    },
    {
      code: 6004,
      name: "MathError",
      msg: "MathError",
    },
    {
      code: 6005,
      name: "Pending",
      msg: "Pending",
    },
  ],
};
