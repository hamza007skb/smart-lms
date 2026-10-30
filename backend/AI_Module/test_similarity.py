import tempfile
import unittest
from pathlib import Path
from docx import Document
from fastapi import HTTPException
from main import SimilarityRequest, compare_passages, check_similarity

class SimilarityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
    def tearDown(self):
        self.tmp.cleanup()
    def document(self, name, text):
        path = self.root / name
        doc = Document()
        doc.add_paragraph(text)
        doc.save(path)
        return str(path)
    def test_highlights_matching_passages_and_source_text(self):
        passage = 'students learn algorithms by solving complex problems with careful analysis'
        new = self.document('new.docx', 'Introduction. ' + passage + '. Conclusion.')
        old = self.document('old.docx', passage)
        result = compare_passages(SimilarityRequest(new_file_path=new, existing_file_paths=[old]))
        self.assertEqual(len(result['matches']), 1)
        match = result['matches'][0]['passages'][0]
        self.assertEqual(match['text'], passage)
        self.assertEqual(match['sourceText'], passage)
        self.assertEqual(result['text'][match['start']:match['end']], passage)
    def test_no_false_highlight_for_short_shared_phrases(self):
        new = self.document('new.docx', 'short common phrase different ending')
        old = self.document('old.docx', 'short common phrase unrelated conclusion')
        self.assertEqual(compare_passages(SimilarityRequest(new_file_path=new, existing_file_paths=[old]))['matches'], [])
    def test_unicode_offsets_match_javascript_utf16(self):
        passage = 'students learn algorithms by solving complex problems with careful analysis'
        new = self.document('new.docx', '🎓 ' + passage)
        old = self.document('old.docx', passage)
        result = compare_passages(SimilarityRequest(new_file_path=new, existing_file_paths=[old]))
        match = result['matches'][0]['passages'][0]
        utf16 = result['text'].encode('utf-16-le')
        self.assertEqual(utf16[match['start']*2:match['end']*2].decode('utf-16-le'), passage)
    def test_first_submission_has_zero_comparative_similarity(self):
        new = self.document('new.docx', 'This is readable original coursework')
        self.assertEqual(check_similarity(SimilarityRequest(new_file_path=new, existing_file_paths=[]))['similarity_percentage'], 0)
    def test_identical_documents_score_one_hundred(self):
        text = 'students learn algorithms by solving complex problems with careful analysis'
        new, old = self.document('new.docx', text), self.document('old.docx', text)
        self.assertEqual(check_similarity(SimilarityRequest(new_file_path=new, existing_file_paths=[old]))['similarity_percentage'], 100)
    def test_empty_text_is_an_analysis_failure(self):
        new = self.document('empty.docx', '')
        with self.assertRaises(HTTPException) as error:
            check_similarity(SimilarityRequest(new_file_path=new, existing_file_paths=[]))
        self.assertEqual(error.exception.status_code, 422)

if __name__ == '__main__':
    unittest.main()
