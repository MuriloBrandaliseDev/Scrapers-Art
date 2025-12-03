import * as XLSX from 'xlsx'
import { Obra } from '../lib/api'

export function exportToExcel(obras: Obra[], filename: string) {
  // Preparar dados para o Excel
  const dados = obras.map((obra) => ({
    'ID': obra.id,
    'Artista': obra.nome_artista || 'N/A',
    'Título': obra.titulo || 'N/A',
    'Categoria': obra.categoria || 'N/A',
    'Valor': obra.valor || 'N/A',
    'Lances': obra.numero_lances !== null && obra.numero_lances !== undefined ? obra.numero_lances : 0,
    'Lote': obra.lote || 'N/A',
    'Data Início Leilão': (obra as any).data_inicio_leilao || obra.data_leilao || 'N/A',
    'Data Coleta': obra.data_coleta ? new Date(obra.data_coleta).toLocaleDateString('pt-BR') : 'N/A',
    'Leiloeiro': obra.leiloeiro || 'N/A',
    'Local': obra.local || 'N/A',
    'URL': obra.url_original || obra.url || 'N/A',
    'Scraper': obra.scraper_name || 'N/A',
  }))

  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(dados)

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 8 },   // ID
    { wch: 25 },  // Artista
    { wch: 40 },  // Título
    { wch: 20 },  // Categoria
    { wch: 15 },  // Valor
    { wch: 10 },  // Lances
    { wch: 10 },  // Lote
    { wch: 18 },  // Data Início Leilão
    { wch: 12 },  // Data Coleta
    { wch: 25 },  // Leiloeiro
    { wch: 20 },  // Local
    { wch: 50 },  // URL
    { wch: 15 },  // Scraper
  ]
  ws['!cols'] = colWidths

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Obras')

  // Gerar arquivo e fazer download
  XLSX.writeFile(wb, filename)
}
