import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import GroupDetail from '@/pages/GroupDetail'
import CardEdit from '@/pages/CardEdit'
import StudyMode from '@/pages/StudyMode'
import TagStudy from '@/pages/TagStudy'
import BulkImport from '@/pages/BulkImport'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/group/:groupId" element={<GroupDetail />} />
          <Route path="/card/new" element={<CardEdit />} />
          <Route path="/card/:id/edit" element={<CardEdit />} />
          <Route path="/study" element={<StudyMode />} />
          <Route path="/study/tags" element={<TagStudy />} />
          <Route path="/bulk-import" element={<BulkImport />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
