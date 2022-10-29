/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export interface ERC20PoolInterface extends utils.Interface {
  functions: {
    "getLockedAmount(address)": FunctionFragment;
    "getUnLockedAmount(address)": FunctionFragment;
    "lock(address,uint256)": FunctionFragment;
    "lockedErc20Balance(address)": FunctionFragment;
    "owner()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "setOptionTrigger(address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "transferTo(address,address,uint256)": FunctionFragment;
    "unlock(uint256,address)": FunctionFragment;
    "unlockedErc20Balance(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getLockedAmount"
      | "getUnLockedAmount"
      | "lock"
      | "lockedErc20Balance"
      | "owner"
      | "renounceOwnership"
      | "setOptionTrigger"
      | "transferOwnership"
      | "transferTo"
      | "unlock"
      | "unlockedErc20Balance"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getLockedAmount",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getUnLockedAmount",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "lock",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "lockedErc20Balance",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setOptionTrigger",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "transferTo",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "unlock",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "unlockedErc20Balance",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "getLockedAmount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUnLockedAmount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "lock", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "lockedErc20Balance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setOptionTrigger",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "transferTo", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "unlock", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "unlockedErc20Balance",
    data: BytesLike
  ): Result;

  events: {
    "LockedAmount(address,uint256,uint256)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "TransferedAmount(address,uint256)": EventFragment;
    "UnlockedAmount(address,uint256,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "LockedAmount"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TransferedAmount"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "UnlockedAmount"): EventFragment;
}

export interface LockedAmountEventObject {
  erc20: string;
  amount: BigNumber;
  newAmount: BigNumber;
}
export type LockedAmountEvent = TypedEvent<
  [string, BigNumber, BigNumber],
  LockedAmountEventObject
>;

export type LockedAmountEventFilter = TypedEventFilter<LockedAmountEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface TransferedAmountEventObject {
  erc20: string;
  amount: BigNumber;
}
export type TransferedAmountEvent = TypedEvent<
  [string, BigNumber],
  TransferedAmountEventObject
>;

export type TransferedAmountEventFilter =
  TypedEventFilter<TransferedAmountEvent>;

export interface UnlockedAmountEventObject {
  erc20: string;
  amount: BigNumber;
  newAmount: BigNumber;
}
export type UnlockedAmountEvent = TypedEvent<
  [string, BigNumber, BigNumber],
  UnlockedAmountEventObject
>;

export type UnlockedAmountEventFilter = TypedEventFilter<UnlockedAmountEvent>;

export interface ERC20Pool extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ERC20PoolInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    getLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getUnLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    lock(
      _erc20Address: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    lockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setOptionTrigger(
      _address: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferTo(
      _erc20Address: PromiseOrValue<string>,
      _beneficiary: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    unlock(
      _amount: PromiseOrValue<BigNumberish>,
      _erc20Address: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    unlockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  getLockedAmount(
    _erc20Address: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getUnLockedAmount(
    _erc20Address: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  lock(
    _erc20Address: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  lockedErc20Balance(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setOptionTrigger(
    _address: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferTo(
    _erc20Address: PromiseOrValue<string>,
    _beneficiary: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  unlock(
    _amount: PromiseOrValue<BigNumberish>,
    _erc20Address: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  unlockedErc20Balance(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    getLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getUnLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    lock(
      _erc20Address: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    lockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    setOptionTrigger(
      _address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    transferTo(
      _erc20Address: PromiseOrValue<string>,
      _beneficiary: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    unlock(
      _amount: PromiseOrValue<BigNumberish>,
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    unlockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {
    "LockedAmount(address,uint256,uint256)"(
      erc20?: null,
      amount?: null,
      newAmount?: null
    ): LockedAmountEventFilter;
    LockedAmount(
      erc20?: null,
      amount?: null,
      newAmount?: null
    ): LockedAmountEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;

    "TransferedAmount(address,uint256)"(
      erc20?: null,
      amount?: null
    ): TransferedAmountEventFilter;
    TransferedAmount(erc20?: null, amount?: null): TransferedAmountEventFilter;

    "UnlockedAmount(address,uint256,uint256)"(
      erc20?: null,
      amount?: null,
      newAmount?: null
    ): UnlockedAmountEventFilter;
    UnlockedAmount(
      erc20?: null,
      amount?: null,
      newAmount?: null
    ): UnlockedAmountEventFilter;
  };

  estimateGas: {
    getLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getUnLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    lock(
      _erc20Address: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    lockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setOptionTrigger(
      _address: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferTo(
      _erc20Address: PromiseOrValue<string>,
      _beneficiary: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    unlock(
      _amount: PromiseOrValue<BigNumberish>,
      _erc20Address: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    unlockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getUnLockedAmount(
      _erc20Address: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    lock(
      _erc20Address: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    lockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setOptionTrigger(
      _address: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferTo(
      _erc20Address: PromiseOrValue<string>,
      _beneficiary: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    unlock(
      _amount: PromiseOrValue<BigNumberish>,
      _erc20Address: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    unlockedErc20Balance(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}