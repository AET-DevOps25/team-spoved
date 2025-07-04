import React from 'react';

interface Props {
	status: string;
	setStatus: (value: string) => void;
	taskCounts: Record<string, number>;
}

const WorkerFilterBar: React.FC<Props> = ({
	status,
	setStatus,
	taskCounts,
}) => {

	const supervisorStatusTabs = [
		{ label: 'Open', value: 'open' },
		{ label: 'In Progress', value: 'in_progress' },
		{ label: 'Finished', value: 'finished' },
		{ label: 'Overdue', value: 'overdue' },
	];


	return (
		<div className="flex flex-col gap-3 sm:gap-4 mb-4">
			{/* Status Tabs */}
			<nav className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-[#DFE3E8]">
				<ul className="flex flex-wrap -mb-px">
					{supervisorStatusTabs.map((tab) => (
						<li key={tab.value} className="mr-0.3">
							<button
								onClick={() => setStatus(tab.value)}
								className={`inline-block p-4 border-b-4 rounded-t-lg ${
									status === tab.value
										? 'text-[#131313] border-[#1A97FE] dark:text-[#131313] dark:border-[#1A97FE]'
										: 'border-transparent'
								}`}
							>
								{taskCounts[tab.value] !== undefined
									? `${tab.label} (${
											taskCounts[tab.value]
									  })`
									: tab.label}
							</button>
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
};

export default WorkerFilterBar;
