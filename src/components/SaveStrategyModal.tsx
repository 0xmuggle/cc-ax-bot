'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Strategy, FilterState } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SaveStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtersToSave: FilterState | null;
}

export const SaveStrategyModal: React.FC<SaveStrategyModalProps> = ({ isOpen, onClose, filtersToSave }) => {
  const { bots, addStrategy } = useStore();
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(1);
  const [botId, setBotId] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (isOpen && bots.length > 0 && !botId) {
      setBotId(bots[0].id);
    }
  }, [isOpen, bots, botId]);

  const handleSave = () => {
    if (!name || !botId || !filtersToSave) {
      alert('请提供策略名称并选择一个Bot。');
      return;
    }

    const botName = bots.find(b => b.id === botId)?.name;

    const newStrategy: Strategy = {
      id: uuidv4(),
      name,
      priority,
      botId,
      botName,
      amount,
      enabled: false, // Disabled by default as requested
      filters: filtersToSave,
    };

    addStrategy(newStrategy);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setPriority(1);
    setBotId('');
    setAmount(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card bg-white">
        <DialogHeader>
          <DialogTitle>保存策略</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">名称</label>
            <input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="priority" className="text-right">优先级</label>
            <select id="priority" value={priority} onChange={e => setPriority(parseInt(e.target.value))} className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
              {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="amount" className="text-right">金额</label>
            <input id="amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="bot" className="text-right">Bot</label>
            <select id="bot" value={botId} onChange={e => setBotId(e.target.value)} className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
              {bots.length === 0 && <option disabled>No bots configured</option>}
              {bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={handleClose}>取消</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};