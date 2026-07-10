import { useState } from 'react';
import { useIndustry } from '../../hooks/useIndustry';
import {
  BuildingLibraryIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  CubeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export const IndustryPage = () => {
  const { industries, industriesLoading, entities, entitiesLoading } = useIndustry();
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIndustry(expandedIndustry === id ? null : id);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مكتبة قطاعات الصناعة</h1>
        <span className="text-sm text-secondary-500">
          {industries.length} قطاع | {entities.length} كيان
        </span>
      </div>

      {/* Industry Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {industriesLoading ? (
          <div className="col-span-full text-center py-8 text-secondary-500">جاري التحميل...</div>
        ) : (
          industries.map((industry: any) => (
            <div key={industry.id} className="card">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(industry.industryId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <BuildingLibraryIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold">{industry.name}</p>
                    <p className="text-xs text-secondary-500">{industry.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-secondary-100 rounded-full px-2 py-1">
                    {industry.controls?.length || 0} ضوابط
                  </span>
                  {expandedIndustry === industry.industryId ? (
                    <ChevronUpIcon className="h-5 w-5 text-secondary-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-secondary-400" />
                  )}
                </div>
              </div>

              {expandedIndustry === industry.industryId && (
                <div className="mt-4 pt-4 border-t border-secondary-100 space-y-3">
                  <p className="text-sm text-secondary-600">{industry.description}</p>

                  {/* Controls */}
                  {industry.controls?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <ShieldCheckIcon className="h-4 w-4 text-primary-600" />
                        الضوابط
                      </h3>
                      <div className="space-y-2">
                        {industry.controls.map((control: any) => (
                          <div key={control.id} className="bg-secondary-50 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{control.controlName}</span>
                              <span className="text-xs bg-primary-100 text-primary-700 rounded px-2 py-0.5">
                                {control.controlId}
                              </span>
                            </div>
                            <p className="text-secondary-500 mt-1">{control.description}</p>
                            <div className="flex gap-2 mt-2 text-xs">
                              <span className="text-secondary-400">الوحدة: {control.module}</span>
                              {control.compliance && (
                                <span className="text-primary-600">{control.compliance}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Agents */}
                  {industry.aiAgents?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <CpuChipIcon className="h-4 w-4 text-primary-600" />
                        وكلاء الذكاء الاصطناعي
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {industry.aiAgents.map((agent: any) => (
                          <span key={agent.id} className="bg-primary-50 text-primary-700 rounded-lg px-3 py-1 text-sm">
                            {agent.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Entity Master */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CubeIcon className="h-5 w-5 text-primary-600" />
          الكيانات الرئيسية
        </h2>
        {entitiesLoading ? (
          <div className="text-center py-4 text-secondary-500">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {entities.map((entity: any) => (
              <div key={entity.id} className="bg-secondary-50 rounded-xl p-3 text-center">
                <p className="font-medium text-sm">{entity.name}</p>
                <p className="text-xs text-secondary-500 mt-1">{entity.type}</p>
                <p className="text-xs text-primary-600 mt-1">{entity.usage}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
