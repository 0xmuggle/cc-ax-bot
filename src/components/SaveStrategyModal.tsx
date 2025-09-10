"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Strategy } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SaveStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: any;
}

export const SaveStrategyModal: React.FC<SaveStrategyModalProps> = ({
  isOpen,
  onClose,
  strategy,
}) => {
  const { bots, addStrategy, updateStrategy } = useStore();
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(1);
  const [botId, setBotId] = useState("");
  const [amount, setAmount] = useState(0);
  const [filterStr, setFilterStr] = useState("");

  useEffect(() => {
    if (strategy?.filters) {
      setFilterStr(JSON.stringify(strategy.filters));
    }
    if (strategy && strategy.botId) {
      setName(strategy.name);
      setPriority(strategy.priority);
      setBotId(strategy.botId);
      setAmount(strategy.amount);
    } else if (isOpen && bots.length > 0 && !botId) {
      setBotId(bots[0].id);
    }
  }, [isOpen, bots, strategy]);

  const handleSave = () => {
    const filters = JSON.parse(filterStr);
    if (!name || !botId || !filters) {
      alert("请提供策略名称并选择一个Bot。");
      return;
    }
    if (!filters) {
      alert("筛选条件格式错误");
      return;
    }
    const botName = bots.find((b) => b.id === botId)?.name;

    const newStrategy = {
      name,
      priority,
      botId,
      botName,
      amount,
      enabled: false, // Disabled by default as requested
      filters: filters,
    };
    if (strategy?.id) {
      updateStrategy({ ...strategy, ...newStrategy });
    } else {
      addStrategy({ ...newStrategy, id: uuidv4() });
    }
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setPriority(1);
    setBotId("");
    setAmount(0);
    setFilterStr("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card bg-white">
        <DialogHeader>
          <DialogTitle>{strategy?.id ? "编辑" : "新增"}策略</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              名称
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="priority" className="text-right">
              优先级
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            >
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="amount" className="text-right">
              金额
            </label>
            <input
              step={0.1}
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="bot" className="text-right">
              Bot
            </label>
            <select
              id="bot"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            >
              {bots.length === 0 && (
                <option disabled>No bots configured</option>
              )}
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="amount" className="text-right">
              策略
            </label>
            <textarea
              rows={6}
              id="strategy"
              value={filterStr}
              onChange={(e) => setFilterStr(e.target.value)}
              className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            ></textarea>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={handleClose}>
              取消
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
