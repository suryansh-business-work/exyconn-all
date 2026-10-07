import { screen } from '@testing-library/react';
import { applyForm, makeNode, pickOption, renderNodeForm } from '../node-form-helpers';

const textbox = (name: string) => screen.getByRole('textbox', { name });
const FILE = { fileName: 'document.pdf', fileType: 'PDF', pages: 1, sizeKb: 120 };

describe('Document form', () => {
  it('edits the file and adds a label/value section', async () => {
    const { user, onApply } = renderNodeForm(makeNode('document'));
    await pickOption(user, 'File type', 'XLSX');
    const pages = screen.getByRole('spinbutton', { name: 'Pages' });
    await user.clear(pages);
    await user.type(pages, '3');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('combobox', { name: 'Section type' })).toHaveTextContent(
      'Label and value pairs',
    );
    await user.type(textbox('Heading'), 'Patient');
    await user.click(screen.getAllByRole('button', { name: 'Add' })[1]);
    await user.type(textbox('Label'), 'Name');
    await user.type(textbox('Value'), 'Priya');
    await user.type(textbox('Preview footer'), 'Signed');
    await user.type(textbox('Caption'), 'Your report');
    expect(await applyForm(user, onApply)).toEqual({
      document: {
        ...FILE,
        fileType: 'XLSX',
        pages: 3,
        preview: {
          title: 'Document',
          sections: [
            { kind: 'fields', heading: 'Patient', fields: [{ label: 'Name', value: 'Priya' }] },
          ],
          footer: 'Signed',
        },
      },
      caption: 'Your report',
    });
  });

  it('turns a section into a table, keeping its heading', async () => {
    const node = makeNode('document', {
      document: {
        ...FILE,
        fileType: 'PDF',
        preview: {
          title: 'Lab report',
          sections: [{ kind: 'text', heading: 'Results', text: 'x' }],
        },
      },
    });
    const { user, onApply } = renderNodeForm(node);
    expect(textbox('Text')).toHaveValue('x');
    await pickOption(user, 'Section type', 'Table');
    expect(screen.queryByRole('textbox', { name: 'Text' })).toBeNull();
    expect(textbox('Heading')).toHaveValue('Results');
    expect(screen.getByText('Item')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Add' })[1]);
    expect(textbox('Id')).toHaveValue('row-1');
    await user.type(screen.getByRole('combobox', { name: 'Cells' }), 'Sugar{Enter}110{Enter}');
    expect(screen.getByRole('combobox', { name: 'Flag' })).toHaveTextContent('None');
    await pickOption(user, 'Flag', 'high');
    expect(await applyForm(user, onApply)).toEqual({
      document: {
        ...FILE,
        preview: {
          title: 'Lab report',
          sections: [
            {
              kind: 'table',
              heading: 'Results',
              columns: ['Item', 'Value'],
              rows: [{ id: 'row-1', cells: ['Sugar', '110'], flag: 'high' }],
            },
          ],
        },
      },
    });
  });

  it('turns a section into a paragraph', async () => {
    const node = makeNode('document', {
      document: {
        ...FILE,
        fileType: 'PDF',
        preview: { title: 'Doc', sections: [{ kind: 'fields', fields: [] }] },
      },
    });
    const { user, onApply } = renderNodeForm(node);
    await pickOption(user, 'Section type', 'Paragraph');
    await user.type(textbox('Text'), 'All normal.');
    expect(await applyForm(user, onApply)).toEqual({
      document: {
        ...FILE,
        preview: { title: 'Doc', sections: [{ kind: 'text', text: 'All normal.' }] },
      },
    });
  });
});
