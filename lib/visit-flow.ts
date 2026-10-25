export function getVisitSteps(type: string) {
  return [
    { page: 'create', label: 'تفاصيل الطلعة' },
    ...(type === 'SOLO' ? [] : [{ page: 'members', label: 'مين معنا؟' }]),
    { page: 'selection', label: type==='SOLO'?'ألعابك':'ألعابكم' },
    { page: 'meals', label: 'وقت البريك' },
    { page: 'preview', label: 'المعاينة' },
  ];
}
export function getNextPageAfterVisitDetails(type: string) { return type === 'SOLO' ? 'selection' : 'members'; }
