'use client';

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/components/ui/table";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Equipment } from "@/app/lib/types/equipment";
import { useEquipment } from "@/app/hooks/use-equipment";
import { EquipmentForm } from "./equipment-form";
import { EquipmentDetail } from "./equipment-detail";
import { DEFENSE_PATTERNS } from "@/app/lib/utils/file-parser";

export default function EquipmentRepository() {
  const { equipment = [], isLoading, error, createEquipment, updateEquipment, deleteEquipment } = useEquipment();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const filteredEquipment = (equipment ?? []).filter((item: Equipment) => {
    const matchesSearch = 
      item.productInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productInfo.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productInfo.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || item.productInfo.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreateEquipment = async (data: Partial<Equipment>) => {
    await createEquipment(data);
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading equipment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (selectedEquipment) {
    return (
      <div className="p-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedEquipment(null)}
          className="mb-4"
        >
          Back to List
        </Button>
        <EquipmentDetail 
          equipment={selectedEquipment}
          onEdit={() => setShowEditForm(true)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Equipment Repository</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  {selectedCategory || 'All Categories'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                  All Categories
                </DropdownMenuItem>
                {DEFENSE_PATTERNS.categories.map((category) => (
                  <DropdownMenuItem 
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {showAddForm ? (
        <EquipmentForm
          onSubmit={handleCreateEquipment}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acquisition Cost</TableHead>
              <TableHead>FSR Support (Annual)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipment.map((item) => (
              <TableRow 
                key={item.id}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedEquipment(item)}
              >
                <TableCell className="font-medium">{item.productInfo.name}</TableCell>
                <TableCell>{item.productInfo.model}</TableCell>
                <TableCell>{item.productInfo.type}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  {item.acquisitionCost ? 
                    `$${item.acquisitionCost.toLocaleString()}` : 
                    'N/A'}
                </TableCell>
                <TableCell>
                  {item.fsrSupportCost ? 
                    `$${item.fsrSupportCost.toLocaleString()}/yr` : 
                    'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 