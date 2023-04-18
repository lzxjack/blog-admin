import { useTitle } from 'ahooks';
import React from 'react';

import MyTable from '@/components/MyTable';
import { _ } from '@/utils/cloudBase';
import { defaultPageSize, siteTitle } from '@/utils/constant';
import { DB } from '@/utils/dbConfig';
import { getTotalPage, myClearCache } from '@/utils/functions';
import { usePage } from '@/utils/hooks/usePage';
import { useTableData } from '@/utils/hooks/useTableData';
import { useUpdateData } from '@/utils/hooks/useUpdateData';

import { Title } from '../titleConfig';
import { useColumns } from './config';

const Draft: React.FC = () => {
  useTitle(`${siteTitle} | ${Title.Drafts}`);

  const { page, setPage } = usePage();

  const { data, total, loading, handleDelete, dataRun, totalRun } = useTableData({
    DBName: DB.Article,
    page,
    setPage,
    where: { post: _.eq(false) }
  });

  useUpdateData(
    () =>
      myClearCache({
        key: `${DB.Article}-${JSON.stringify({ post: _.eq(false) })}`,
        page: 1,
        totalPage: getTotalPage(total, defaultPageSize),
        deleteTotal: true
      }),
    () => {
      dataRun();
      totalRun();
    }
  );

  const handleEdit = (id: string) => {
    console.log(id);
  };

  const columns = useColumns({
    handleEdit,
    handleDelete,
    deleteProps: {
      page,
      setPage
    }
  });

  return (
    <MyTable
      loading={loading}
      columns={columns}
      data={data}
      total={total}
      page={page}
      setPage={setPage}
      noHeader={true}
    />
  );
};

export default Draft;
