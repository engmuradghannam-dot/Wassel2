import { useState, FormEvent } from 'react';
import { TagIcon, PlusIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { usePriceLists, usePriceListDetail } from '../../hooks/usePriceLists';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';

const emptyList = { name: '', currency: 'SAR', isDefault: false, customerGroup: '' };
const emptyItem = { itemId: '', price: 0, minQty: 1 };

export const PriceListsPage = () => {
  const { selectedCompany } = useAuthStore();
  const { priceLists, isLoading, createPriceList, addItem, deletePriceList } = usePriceLists();
  const { items } = useItems();

  const [selectedListId, setSelectedListId] = useState<string>('');
  const { priceList } = usePriceListDetail(selectedListId);

  const [listModalOpen, setListModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [listForm, setListForm] = useState(emptyList);
  const [itemForm, setItemForm] = useState(emptyItem);

  const handleCreateList = async (e: FormEvent) => {
    e.preventDefault();
    await createPriceList(listForm);
    setListForm(emptyList);
    setListModalOpen(false);
  };

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedListId) return;
    await addItem({ id: selectedListId, payload: { ...itemForm, price: Number(itemForm.price), minQty: Number(itemForm.minQty) } });
    setItemForm(emptyItem);
    setItemModalOpen(false);
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <TagIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">Select a company first</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Pricing Procedure</h1>
        <button onClick={() => setListModalOpen(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> New Price List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Price Lists</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
          ) : priceLists.length === 0 ? (
            <p className="text-secondary-500 text-center py-8">No price lists yet</p>
          ) : (
            <div className="space-y-2">
              {priceLists.map((pl: any) => (
                <button
                  key={pl.id}
                  onClick={() => setSelectedListId(pl.id)}
                  className={`w-full text-start p-3 rounded-lg border flex items-center justify-between ${
                    selectedListId === pl.id ? 'border-primary-600 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1">
                      {pl.name} {pl.isDefault && <StarIcon className="w-4 h-4 text-warning-500 fill-warning-500" />}
                    </div>
                    <div className="text-xs text-secondary-500">{pl.customerGroup || 'All customers'} · {pl._count?.items || 0} items</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePriceList(pl.id); if (selectedListId === pl.id) setSelectedListId(''); }}
                    className="p-1 text-secondary-400 hover:text-danger-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{priceList ? priceList.name : 'Select a price list'}</h2>
            {priceList && (
              <button onClick={() => setItemModalOpen(true)} className="btn-secondary text-sm flex items-center gap-2">
                <PlusIcon className="w-4 h-4" /> Add Item Price
              </button>
            )}
          </div>
          {!priceList ? (
            <p className="text-secondary-500 text-center py-12">Choose a price list from the left to view and manage item prices</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Min Qty</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {(!priceList.items || priceList.items.length === 0) && (
                    <tr><td colSpan={3} className="text-center py-8 text-secondary-500">No item prices set</td></tr>
                  )}
                  {priceList.items?.map((it: any) => (
                    <tr key={it.id} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 text-sm font-medium">{it.item?.name} ({it.item?.code})</td>
                      <td className="px-4 py-3 text-sm">{Number(it.minQty)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{Number(it.price).toLocaleString()} {priceList.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={listModalOpen} onClose={() => setListModalOpen(false)} title="New Price List">
        <form onSubmit={handleCreateList} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input className="form-input" required value={listForm.name} onChange={(e) => setListForm({ ...listForm, name: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Customer Group (optional)</label>
            <input className="form-input" placeholder="e.g. VIP, Wholesale" value={listForm.customerGroup} onChange={(e) => setListForm({ ...listForm, customerGroup: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={listForm.isDefault} onChange={(e) => setListForm({ ...listForm, isDefault: e.target.checked })} />
            Set as company default price list
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setListModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} title="Add Item Price">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="form-label">Item</label>
            <select className="form-input" required value={itemForm.itemId} onChange={(e) => setItemForm({ ...itemForm, itemId: e.target.value })}>
              <option value="">Select item...</option>
              {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Min Quantity</label>
              <input type="number" className="form-input" min={1} value={itemForm.minQty} onChange={(e) => setItemForm({ ...itemForm, minQty: Number(e.target.value) })} />
            </div>
            <div>
              <label className="form-label">Price</label>
              <input type="number" className="form-input" required value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setItemModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
